export type SatelliteStatus = 'ACTIF' | 'INACTIF';

export interface Satellite {
  id: number;
  name: string;
  status: SatelliteStatus;
  massKg?: number | null;
  altitudeKm?: number | null;
  inclinationDeg?: number | null;
  eccentricity?: number | null;
  createdAt: string;
  updatedAt: string;
  missionId: number;
  missionName: string;
}

export interface SatelliteCreateRequest {
  name: string;
  massKg?: number | null;
  altitudeKm?: number | null;
  inclinationDeg?: number | null;
  eccentricity?: number | null;
}

export interface SatelliteUpdateRequest {
  name: string;
  massKg?: number | null;
  altitudeKm?: number | null;
  inclinationDeg?: number | null;
  eccentricity?: number | null;
}

export interface OrbitParamsUpdateRequest {
  massKg: number;
  altitudeKm: number;
  inclinationDeg: number;
  eccentricity: number;
}
