import { create } from 'zustand';

interface MapState {
  userLocation: { latitude: number; longitude: number } | null;
  hasInitialized: boolean;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  hasInitialized: false,
  setUserLocation: (location) => set({ userLocation: location, hasInitialized: true }),
  setInitialized: (initialized) => set({ hasInitialized: initialized }),
}));
