import { create } from 'zustand';
import { hazardService } from '@/services/hazardService';
import { Hazard, CreateHazardData } from '@/types/hazard';

interface HazardState {
  hazards: Hazard[];
  loading: boolean;
  error: string | null;
  fetchHazards: () => Promise<void>;
  fetchNearby: (latitude: number, longitude: number, radius?: number) => Promise<void>;
  createHazard: (data: CreateHazardData) => Promise<void>;
  deleteHazard: (id: string) => Promise<void>;
}

export const useHazardStore = create<HazardState>((set) => ({
  hazards: [],
  loading: false,
  error: null,

  fetchHazards: async () => {
    set({ loading: true, error: null });
    try {
      const hazards = await hazardService.getActive();
      set({ hazards, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNearby: async (latitude: number, longitude: number, radius?: number) => {
    set({ loading: true, error: null });
    try {
      const hazards = await hazardService.getNearby(latitude, longitude, radius);
      set({ hazards, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createHazard: async (data: CreateHazardData) => {
    set({ loading: true, error: null });
    try {
      const newHazard = await hazardService.create(data);
      set((state) => ({
        hazards: [newHazard, ...state.hazards],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteHazard: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await hazardService.delete(id);
      set((state) => ({
        hazards: state.hazards.filter((h) => h.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
