export enum HazardType {
  ACCIDENT = 'accident',
  ROAD_ISSUE = 'road_issue',
  WARNING = 'warning',
  POLICE = 'police',
  OTHER = 'other',
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
