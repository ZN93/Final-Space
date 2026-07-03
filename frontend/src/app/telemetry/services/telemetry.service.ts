import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TelemetryImportResponse } from '../models/telemetry-import.model';
import { TelemetryQueryResponse } from '../models/telemetry-query.model';
import {
  TelemetryAnomalyDetectionResponse,
  TelemetryAnomalyQueryResponse
} from '../models/telemetry-anomaly.model';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  importCsv(
    missionId: number,
    satelliteId: number,
    file: File
  ): Observable<TelemetryImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<TelemetryImportResponse>(
      `${this.apiUrl}/missions/${missionId}/satellites/${satelliteId}/telemetry/import`,
      formData
    );
  }

  getAvailableMetrics(satelliteId: number): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/satellites/${satelliteId}/telemetry/metrics`
    );
  }

  getTelemetry(
    satelliteId: number,
    metrics: string[],
    from?: string | null,
    to?: string | null,
    limit = 5000
  ): Observable<TelemetryQueryResponse> {
    let params = new HttpParams();

    metrics.forEach((metric) => {
      params = params.append('metric', metric);
    });

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    params = params.set('limit', limit);

    return this.http.get<TelemetryQueryResponse>(
      `${this.apiUrl}/satellites/${satelliteId}/telemetry`,
      { params }
    );
  }

  detectAnomalies(
    satelliteId: number,
    metrics: string[],
    from?: string | null,
    to?: string | null
  ): Observable<TelemetryAnomalyDetectionResponse> {
    let params = new HttpParams();

    metrics.forEach((metric) => {
      params = params.append('metric', metric);
    });

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.post<TelemetryAnomalyDetectionResponse>(
      `${this.apiUrl}/satellites/${satelliteId}/anomalies/detect`,
      null,
      { params }
    );
  }

  getAnomalies(
    satelliteId: number,
    metrics: string[] = [],
    from?: string | null,
    to?: string | null
  ): Observable<TelemetryAnomalyQueryResponse> {
    let params = new HttpParams();

    metrics.forEach((metric) => {
      params = params.append('metric', metric);
    });

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<TelemetryAnomalyQueryResponse>(
      `${this.apiUrl}/satellites/${satelliteId}/anomalies`,
      { params }
    );
  }
}
