import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulationResponse } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  launchOrbitSimulation(satelliteId: number): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(
      `${this.apiUrl}/satellites/${satelliteId}/simulations/orbit`,
      {}
    );
  }
}
