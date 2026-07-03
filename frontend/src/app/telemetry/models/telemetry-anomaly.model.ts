export type TelemetryAnomalyType = 'THRESHOLD' | 'VARIATION' | 'MISSING';

export type TelemetryAnomalySeverity = 'FAIBLE' | 'MOYENNE' | 'ELEVEE';

export interface TelemetryAnomaly {
  id: string;
  missionId: number;
  satelliteId: number;
  metric: string;
  type: TelemetryAnomalyType;
  severity: TelemetryAnomalySeverity;
  timestamp: string;
  value: number;
  previousValue?: number | null;
  previousTimestamp?: string | null;
  ruleName: string;
  thresholdUsed?: number | null;
  message: string;
}

export interface TelemetryAnomalyQueryResponse {
  satelliteId: number;
  count: number;
  anomalies: TelemetryAnomaly[];
}

export interface TelemetryAnomalyDetectionResponse {
  satelliteId: number;
  detectedCount: number;
  savedCount: number;
  anomalies: TelemetryAnomaly[];
}
