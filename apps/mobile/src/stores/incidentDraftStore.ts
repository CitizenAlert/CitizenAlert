import { create } from 'zustand';
import { ProblemType } from '@/services/hazardService';

export interface IncidentDraft {
  latitude: number;
  longitude: number;
  problemType: ProblemType | null;
  photoUri: string | null;
  description: string;
  /** When true, map screen will add this draft as a marker and then reset. */
  pendingAddToMap: boolean;
}

interface IncidentDraftStore extends IncidentDraft {
  setCoords: (latitude: number, longitude: number) => void;
  setProblemType: (problemType: ProblemType) => void;
  setPhoto: (uri: string | null) => void;
  setDescription: (description: string) => void;
  setDraft: (params: {
    latitude: number;
    longitude: number;
    problemType: ProblemType;
  }) => void;
  setPendingAddToMap: (value: boolean) => void;
  reset: () => void;
}

const initialState: IncidentDraft = {
  latitude: 0,
  longitude: 0,
  problemType: null,
  photoUri: null,
  description: '',
  pendingAddToMap: false,
};

export const useIncidentDraftStore = create<IncidentDraftStore>((set) => ({
  ...initialState,

  setCoords: (latitude, longitude) =>
    set({ latitude, longitude }),

  setProblemType: (problemType) =>
    set({ problemType }),

  setPhoto: (photoUri) =>
    set({ photoUri }),

  setDescription: (description) =>
    set({ description }),

  setDraft: ({ latitude, longitude, problemType }) =>
    set({
      latitude,
      longitude,
      problemType,
      photoUri: null,
      description: '',
    }),

  setPendingAddToMap: (pendingAddToMap) =>
    set({ pendingAddToMap }),

  reset: () =>
    set(initialState),
}));
