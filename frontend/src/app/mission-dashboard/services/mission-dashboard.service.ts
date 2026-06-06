import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MissionDashboard } from '../models/mission-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class MissionDashboardService {

  private readonly apiUrl = 'http://localhost:8080/api/missions';

  constructor(private http: HttpClient) {}

  getMissionDashboard(missionId: number): Observable<MissionDashboard> {
    return this.http.get<MissionDashboard>(`${this.apiUrl}/${missionId}/dashboard`);
  }
}
