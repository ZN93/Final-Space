export type SimulationType = 'ORBIT' | 'HOHMANN';

export type SimulationStatus = 'SUCCESS' | 'FAILED';

export interface SimulationResponse {
  id: number;
  missionId: number;
  missionName: string;
  satelliteId: number;
  satelliteName: string;
  type: SimulationType;
  status: SimulationStatus;

  inputMassKg: number;
  inputAltitudeKm: number;
  inputInclinationDeg: number;
  inputEccentricity: number;

  orbitalPeriodMinutes: number | null;
  averageVelocityKmS: number | null;
  orbitShape: string | null;

  targetAltitudeKm: number | null;
  deltaV1MS: number | null;
  deltaV2MS: number | null;
  deltaVTotalMS: number | null;
  transferTimeMinutes: number | null;

  plotDataJson: string;

  createdAt: string;
  createdBy: string;
}

export interface OrbitPlotPoint {
  x: number;
  y: number;
}

export interface HohmannPlotData {
  initialOrbit: OrbitPlotPoint[];
  targetOrbit: OrbitPlotPoint[];
  transferArc: OrbitPlotPoint[];
}
