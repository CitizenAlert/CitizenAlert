import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GeocodeService } from '../geolocation/geocode.service';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface NotificationPayload {
  hazardId: string;
  type: string;
  description: string;
  city: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('NotificationsGateway');
  private userCities = new Map<string, string>(); // Map socket id to city

  constructor(private geocodeService: GeocodeService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const city = this.userCities.get(client.id);
    if (city) {
      this.logger.log(`Client ${client.id} disconnected from city: ${city}`);
      this.userCities.delete(client.id);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Handle location subscription - users send their GPS coordinates
   * and are added to the city room
   */
  @SubscribeMessage('subscribe:location')
  async handleLocationSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationData,
  ) {
    try {
      const { latitude, longitude } = data;

      // Validate coordinates
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        client.emit('error', {
          message: 'Invalid coordinates provided',
        });
        return;
      }

      // Get city from coordinates
      const city = await this.geocodeService.getCityFromCoordinates(latitude, longitude);

      if (!city) {
        client.emit('error', {
          message: 'Could not determine city from location',
        });
        return;
      }

      // Leave previous city room if any
      const previousCity = this.userCities.get(client.id);
      if (previousCity && previousCity !== city) {
        client.leave(`city:${previousCity}`);
        this.logger.log(`Client ${client.id} left room: city:${previousCity}`);
      }

      // Join city room
      client.join(`city:${city}`);
      this.userCities.set(client.id, city);

      this.logger.log(`Client ${client.id} subscribed to city: ${city}`);

      // Confirm subscription
      client.emit('subscribed', {
        city,
        latitude,
        longitude,
        message: `Successfully subscribed to notifications for ${city}`,
      });

      // Notify room about new subscriber
      this.server.to(`city:${city}`).emit('user:subscribed', {
        city,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error handling location subscription:', error);
      client.emit('error', {
        message: 'Failed to process location subscription',
      });
    }
  }

  /**
   * Broadcast notification to a city room
   * Called by the NotificationsService when a hazard is created
   */
  broadcastToCity(city: string, notification: NotificationPayload) {
    const roomName = `city:${city}`;
    this.logger.log(`Broadcasting notification to room: ${roomName}`);

    this.server.to(roomName).emit('notification:hazard', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast to all connected clients (not city-specific)
   */
  broadcastToAll(event: string, data: any) {
    this.logger.log(`Broadcasting to all clients: ${event}`);
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get room statistics
   */
  getRoomStats(city: string) {
    const roomName = `city:${city}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    return {
      city,
      subscriberCount: room ? room.size : 0,
    };
  }

  /**
   * Get all active city rooms
   */
  getActiveCities() {
    const cities = new Map<string, number>();
    this.userCities.forEach((city) => {
      cities.set(city, (cities.get(city) || 0) + 1);
    });
    return Array.from(cities.entries()).map(([city, count]) => ({
      city,
      subscribers: count,
    }));
  }
}
