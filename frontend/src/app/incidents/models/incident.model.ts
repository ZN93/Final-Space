export type IncidentStatus = 'OUVERT' | 'EN_COURS' | 'CLOTURE';

export type IncidentSeverity = 'FAIBLE' | 'MOYENNE' | 'ELEVEE';

export interface Incident {
  id: number;
  missionId: number;
  missionName: string;
  satelliteId?: number | null;
  satelliteName?: string | null;
  alertId?: number | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  createdBy: string;
}

export interface IncidentCreateRequest {
  satelliteId?: number | null;
  alertId?: number | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  severity: IncidentSeverity;
}

export interface IncidentUpdateRequest {
  title: string;
  description?: string | null;
  notes?: string | null;
  severity: IncidentSeverity;
}

export interface IncidentStatusUpdateRequest {
  status: IncidentStatus;
}
