import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  SimulationListItemResponse,
  SimulationResponse
} from '../models/simulation.model';
import { SimulationService } from './simulation.service';

describe('SimulationService', () => {
  let service: SimulationService;
  let httpMock: HttpTestingController;

  const simulation: SimulationResponse = {
    id: 10,
    missionId: 3,
    missionName: 'Mission Alpha',
    satelliteId: 4,
    satelliteName: 'FS-01',
    type: 'ORBIT',
    status: 'SUCCESS',
    inputMassKg: 850,
    inputAltitudeKm: 500,
    inputInclinationDeg: 51.6,
    inputEccentricity: 0.01,
    orbitalPeriodMinutes: 94.6,
    averageVelocityKmS: 7.61,
    orbitShape: 'ELLIPTICAL',
    targetAltitudeKm: null,
    deltaV1MS: null,
    deltaV2MS: null,
    deltaVTotalMS: null,
    transferTimeMinutes: null,
    plotDataJson: '[]',
    createdAt: '2026-07-14T10:00:00Z',
    createdBy: 'admin@finalspace.fr'
  };

  const simulationListItem: SimulationListItemResponse = {
    id: simulation.id,
    missionId: simulation.missionId,
    missionName: simulation.missionName,
    satelliteId: simulation.satelliteId,
    satelliteName: simulation.satelliteName,
    type: simulation.type,
    status: simulation.status,
    createdAt: simulation.createdAt,
    createdBy: simulation.createdBy,
    inputAltitudeKm: simulation.inputAltitudeKm,
    targetAltitudeKm: null,
    orbitalPeriodMinutes: simulation.orbitalPeriodMinutes,
    averageVelocityKmS: simulation.averageVelocityKmS,
    orbitShape: simulation.orbitShape,
    deltaVTotalMS: null,
    transferTimeMinutes: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SimulationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SimulationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit lancer une simulation orbitale', () => {
    service
      .launchOrbitSimulation(4)
      .subscribe(result => {
        expect(result).toEqual(simulation);
      });

    const request = httpMock.expectOne(
      '/api/satellites/4/simulations/orbit'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush(simulation);
  });

  it('doit lancer un transfert de Hohmann', () => {
    const hohmannSimulation: SimulationResponse = {
      ...simulation,
      id: 11,
      type: 'HOHMANN',
      targetAltitudeKm: 800,
      orbitalPeriodMinutes: null,
      averageVelocityKmS: null,
      orbitShape: null,
      deltaV1MS: 100,
      deltaV2MS: 95,
      deltaVTotalMS: 195,
      transferTimeMinutes: 45
    };

    service
      .launchHohmannTransfer(4, 800)
      .subscribe(result => {
        expect(result.type).toBe('HOHMANN');
      });

    const request = httpMock.expectOne(
      '/api/satellites/4/simulations/hohmann'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      altitudeTargetKm: 800
    });

    request.flush(hohmannSimulation);
  });

  it('doit charger les simulations d’un satellite', () => {
    service.findBySatellite(4).subscribe(result => {
      expect(result).toEqual([simulationListItem]);
    });

    const request = httpMock.expectOne(
      '/api/satellites/4/simulations'
    );

    expect(request.request.method).toBe('GET');

    request.flush([simulationListItem]);
  });

  it('doit charger une simulation par identifiant', () => {
    service.findById(10).subscribe(result => {
      expect(result).toEqual(simulation);
    });

    const request = httpMock.expectOne(
      '/api/simulations/10'
    );

    expect(request.request.method).toBe('GET');

    request.flush(simulation);
  });

  it('doit exporter une simulation en CSV', () => {
    service.exportCsv(10).subscribe(blob => {
      expect(blob.size).toBeGreaterThan(0);
    });

    const request = httpMock.expectOne(
      '/api/simulations/10/export/csv'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(
      new Blob(
        ['csv-content'],
        { type: 'text/csv' }
      )
    );
  });

  it('doit exporter une simulation en PDF', () => {
    service.exportPdf(10).subscribe(blob => {
      expect(blob.size).toBeGreaterThan(0);
    });

    const request = httpMock.expectOne(
      '/api/simulations/10/export/pdf'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(
      new Blob(
        ['pdf-content'],
        { type: 'application/pdf' }
      )
    );
  });
});
