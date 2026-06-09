export type SimulationType = 'ORBIT';

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

  orbitalPeriodMinutes: number;
  averageVelocityKmS: number;
  orbitShape: string;
  plotDataJson: string;

  createdAt: string;
  createdBy: string;
}

export interface OrbitPlotPoint {
  x: number;
  y: number;
}
