import { api } from './api';
import { Hazard, CreateHazardData } from '@/types/hazard';

export const hazardService = {
  async getAll(): Promise<Hazard[]> {
    const response = await api.get<Hazard[]>('/hazards');
    return response.data;
  },

  async getActive(): Promise<Hazard[]> {
    const response = await api.get<Hazard[]>('/hazards/active');
    return response.data;
  },

  async getNearby(latitude: number, longitude: number, radius?: number): Promise<Hazard[]> {
    const response = await api.get<Hazard[]>('/hazards/nearby', {
      params: { lat: latitude, lon: longitude, radius },
    });
    return response.data;
  },

  async getById(id: string): Promise<Hazard> {
    const response = await api.get<Hazard>(`/hazards/${id}`);
    return response.data;
  },

  async create(data: CreateHazardData): Promise<Hazard> {
    const response = await api.post<Hazard>('/hazards', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateHazardData>): Promise<Hazard> {
    const response = await api.patch<Hazard>(`/hazards/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/hazards/${id}`);
  },
};
