import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface HazardNotification {
  hazardId: string;
  type: string;
  description: string;
  city: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingLocation: LocationData | null = null;

  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      // Get base URL (e.g., http://localhost:3001)
      const baseUrl = getApiBaseUrl();
      
      console.log('[WebSocket] Connecting to:', baseUrl);

      this.socket = io(baseUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected with ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected');

      // If there's a pending location subscription, send it now
      if (this.pendingLocation) {
        console.log('[WebSocket] Sending pending location subscription');
        this.subscribeToLocation(this.pendingLocation);
        this.pendingLocation = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.emit('error', { message: 'Connection error' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnection attempt ${this.reconnectAttempts}`);
    });

    // Listen for subscription confirmation
    this.socket.on('subscribed', (data) => {
      console.log('[WebSocket] Subscribed to city:', data.city);
      this.emit('subscribed', data);
    });

    // Listen for real-time hazard notifications
    this.socket.on('notification:hazard', (notification: HazardNotification) => {
      console.log('[WebSocket] Received hazard notification:', notification);
      this.emit('hazard:new', notification);
    });

    // Listen for user subscription events
    this.socket.on('user:subscribed', (data) => {
      console.log('[WebSocket] User subscribed to city:', data);
    });

    // Listen for errors
    this.socket.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Subscribe to city notifications based on user location
   */
  subscribeToLocation(location: LocationData): void {
    if (!this.socket) {
      console.log('[WebSocket] Socket not initialized, storing location for later');
      this.pendingLocation = location;
      return;
    }

    if (!this.socket.connected) {
      console.log('[WebSocket] Socket not yet connected, queuing location subscription');
      this.pendingLocation = location;
      return;
    }

    console.log('[WebSocket] Subscribing to location:', location);
    this.socket.emit('subscribe:location', location);
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(): void {
    if (!this.socket?.connected) return;

    console.log('[WebSocket] Unsubscribing');
    this.socket.emit('unsubscribe:location');
  }

  /**
   * Register a listener for WebSocket events
   */
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event to local listeners
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const webSocketService = new WebSocketService();
