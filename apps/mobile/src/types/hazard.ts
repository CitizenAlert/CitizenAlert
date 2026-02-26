export enum HazardType {
  INONDATION = 'inondation',
  FUITE_EAU = 'fuite_eau',
  ARBRE_TOMBE = 'arbre_tombe',
  DEPOT_SAUVAGE = 'depot_sauvage',
  NID_DE_POULE = 'nid_de_poule',
  ECLAIRAGE_PUBLIC_DEFECTUEUX = 'eclairage_public_defectueux',
  FEU_TRICOLORE_PANNE = 'feu_tricolore_panne',
  TROTTOIR_VOIRIE_DEGRADE = 'trottoir_voirie_degrade',
  MOBILIER_URBAIN_DETERIORE = 'mobilier_urbain_deteriore',
  NUISIBLES_INSALUBRITE = 'nuisibles_insalubrite',
}

export enum HazardStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
}

export interface Hazard {
  id: string;
  type: HazardType;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: HazardStatus;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHazardData {
  type: HazardType;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
}
