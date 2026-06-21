import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TelemetryImportResponse } from '../models/telemetry-import.model';

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
}
