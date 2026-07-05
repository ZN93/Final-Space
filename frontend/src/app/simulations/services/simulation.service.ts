import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulationResponse, SimulationListItemResponse } from '../models/simulation.model';

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

  launchHohmannTransfer(
    satelliteId: number,
    altitudeTargetKm: number
  ): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(
      `${this.apiUrl}/satellites/${satelliteId}/simulations/hohmann`,
      { altitudeTargetKm }
    );
  }

  findBySatellite(satelliteId: number): Observable<SimulationListItemResponse[]> {
    return this.http.get<SimulationListItemResponse[]>(
      `${this.apiUrl}/satellites/${satelliteId}/simulations`
    );
  }

  findById(simulationId: number): Observable<SimulationResponse> {
    return this.http.get<SimulationResponse>(
      `${this.apiUrl}/simulations/${simulationId}`
    );
  }

  exportCsv(simulationId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/simulations/${simulationId}/export/csv`,
      {
        responseType: 'blob'
      }
    );
  }

  exportPdf(simulationId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/simulations/${simulationId}/export/pdf`,
      {
        responseType: 'blob'
      }
    );
  }
}
