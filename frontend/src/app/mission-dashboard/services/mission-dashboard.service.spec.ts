import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MissionDashboard } from '../models/mission-dashboard.model';
import { MissionDashboardService } from './mission-dashboard.service';

describe('MissionDashboardService', () => {
  let service: MissionDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MissionDashboardService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(
      MissionDashboardService
    );

    httpMock = TestBed.inject(
      HttpTestingController
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger le dashboard d’une mission', () => {
    const dashboard: MissionDashboard = {
      missionId: 3,
      missionName: 'Mission Alpha',
      missionStatus: 'ACTIVE',
      totalSatellites: 4,
      activeSatellites: 3,
      inactiveSatellites: 1,
      activeAlerts: 2,
      acknowledgedAlerts: 5,
      openIncidents: 1,
      inProgressIncidents: 2,
      closedIncidents: 8,
      lastSimulations: [
        'Simulation orbitale #10'
      ],
      lastTelemetryImports: [
        'Import telemetry.csv'
      ]
    };

    service
      .getMissionDashboard(3)
      .subscribe(result => {
        expect(result).toEqual(dashboard);
      });

    const request = httpMock.expectOne(
      '/api/missions/3/dashboard'
    );

    expect(request.request.method).toBe('GET');

    request.flush(dashboard);
  });
});
