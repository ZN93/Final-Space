import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Mission,
  MissionCreateRequest,
  MissionUpdateRequest
} from '../models/mission.model';

@Injectable({
  providedIn: 'root'
})
export class MissionService {

  private readonly apiUrl = 'http://localhost:8080/api/missions';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Mission[]> {
    return this.http.get<Mission[]>(this.apiUrl);
  }

  findById(id: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.apiUrl}/${id}`);
  }

  create(request: MissionCreateRequest): Observable<Mission> {
    return this.http.post<Mission>(this.apiUrl, request);
  }

  update(id: number, request: MissionUpdateRequest): Observable<Mission> {
    return this.http.put<Mission>(`${this.apiUrl}/${id}`, request);
  }

  close(id: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.apiUrl}/${id}/close`, {});
  }
}
