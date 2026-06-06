export type MissionStatus = 'ACTIVE' | 'CLOTUREE';

export interface Mission {
  id: number;
  name: string;
  description?: string;
  status: MissionStatus;
  createdAt: string;
  closedAt?: string | null;
}

export interface MissionCreateRequest {
  name: string;
  description?: string;
}

export interface MissionUpdateRequest {
  name: string;
  description?: string;
}
