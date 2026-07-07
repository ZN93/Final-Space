import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Incident,
  IncidentCreateRequest,
  IncidentStatus,
  IncidentStatusUpdateRequest,
  IncidentUpdateRequest
} from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {

  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  findByMission(missionId: number, status?: IncidentStatus | 'ALL'): Observable<Incident[]> {
    let params = new HttpParams();

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<Incident[]>(
      `${this.apiUrl}/missions/${missionId}/incidents`,
      { params }
    );
  }

  findById(id: number): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/incidents/${id}`);
  }

  create(missionId: number, request: IncidentCreateRequest): Observable<Incident> {
    return this.http.post<Incident>(
      `${this.apiUrl}/missions/${missionId}/incidents`,
      request
    );
  }

  update(id: number, request: IncidentUpdateRequest): Observable<Incident> {
    return this.http.put<Incident>(
      `${this.apiUrl}/incidents/${id}`,
      request
    );
  }

  updateStatus(id: number, status: IncidentStatus): Observable<Incident> {
    const request: IncidentStatusUpdateRequest = { status };

    return this.http.post<Incident>(
      `${this.apiUrl}/incidents/${id}/status`,
      request
    );
  }

  close(id: number): Observable<Incident> {
    return this.http.post<Incident>(
      `${this.apiUrl}/incidents/${id}/close`,
      {}
    );
  }
}
