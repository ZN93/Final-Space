import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, AlertStatus } from '../models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private readonly apiUrl = 'http://localhost:8080/api/missions';

  constructor(private http: HttpClient) {}

  findByMission(missionId: number, status?: AlertStatus | 'ALL'): Observable<Alert[]> {
    let params = new HttpParams();

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<Alert[]>(
      `${this.apiUrl}/${missionId}/alerts`,
      { params }
    );
  }
}
