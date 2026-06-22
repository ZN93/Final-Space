export interface TelemetryPoint {
  timestamp: string;
  metric: string;
  value: number;
}

export interface TelemetryQueryResponse {
  satelliteId: number;
  metrics: string[];
  count: number;
  points: TelemetryPoint[];
}
