import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Satellite,
  SatelliteCreateRequest,
  SatelliteUpdateRequest
} from '../models/satellite.model';

@Injectable({
  providedIn: 'root'
})
export class SatelliteService {

  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  findByMission(missionId: number): Observable<Satellite[]> {
    return this.http.get<Satellite[]>(`${this.apiUrl}/missions/${missionId}/satellites`);
  }

  findById(id: number): Observable<Satellite> {
    return this.http.get<Satellite>(`${this.apiUrl}/satellites/${id}`);
  }

  create(missionId: number, request: SatelliteCreateRequest): Observable<Satellite> {
    return this.http.post<Satellite>(`${this.apiUrl}/missions/${missionId}/satellites`, request);
  }

  update(id: number, request: SatelliteUpdateRequest): Observable<Satellite> {
    return this.http.put<Satellite>(`${this.apiUrl}/satellites/${id}`, request);
  }

  disable(id: number): Observable<Satellite> {
    return this.http.post<Satellite>(`${this.apiUrl}/satellites/${id}/disable`, {});
  }

}
