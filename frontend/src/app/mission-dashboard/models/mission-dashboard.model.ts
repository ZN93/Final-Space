export type MissionStatus = 'ACTIVE' | 'CLOTUREE';

export interface MissionDashboard {
  missionId: number;
  missionName: string;
  missionStatus: MissionStatus;

  totalSatellites: number;
  activeSatellites: number;
  inactiveSatellites: number;

  activeAlerts: number;
  acknowledgedAlerts: number;

  openIncidents: number;
  inProgressIncidents: number;
  closedIncidents: number;

  lastSimulations: string[];
  lastTelemetryImports: string[];
}
