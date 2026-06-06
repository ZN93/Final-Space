export type AlertStatus = 'ACTIVE' | 'ACQUITTEE';

export type AlertSeverity = 'FAIBLE' | 'MOYENNE' | 'ELEVEE';

export interface Alert {
  id: number;
  missionId: number;
  missionName: string;
  satelliteId?: number | null;
  satelliteName?: string | null;
  metric: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  ackAt?: string | null;
  ackBy?: string | null;
}
