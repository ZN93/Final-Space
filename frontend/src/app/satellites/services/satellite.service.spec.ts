import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  Satellite,
  SatelliteCreateRequest,
  SatelliteUpdateRequest
} from '../models/satellite.model';
import { SatelliteService } from './satellite.service';

describe('SatelliteService', () => {
  let service: SatelliteService;
  let httpMock: HttpTestingController;

  const satellite: Satellite = {
    id: 4,
    name: 'FS-01',
    status: 'ACTIF',
    massKg: 850,
    altitudeKm: 500,
    inclinationDeg: 51.6,
    eccentricity: 0.01,
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
    missionId: 3,
    missionName: 'Mission Alpha'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SatelliteService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SatelliteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger les satellites d’une mission', () => {
    service.findByMission(3).subscribe(result => {
      expect(result).toEqual([satellite]);
    });

    const request = httpMock.expectOne(
      '/api/missions/3/satellites'
    );

    expect(request.request.method).toBe('GET');

    request.flush([satellite]);
  });

  it('doit charger un satellite par identifiant', () => {
    service.findById(4).subscribe(result => {
      expect(result).toEqual(satellite);
    });

    const request = httpMock.expectOne(
      '/api/satellites/4'
    );

    expect(request.request.method).toBe('GET');

    request.flush(satellite);
  });

  it('doit créer un satellite', () => {
    const createRequest: SatelliteCreateRequest = {
      name: 'FS-02',
      massKg: 900,
      altitudeKm: 600,
      inclinationDeg: 45,
      eccentricity: 0.02
    };

    service.create(3, createRequest).subscribe(result => {
      expect(result.name).toBe('FS-02');
    });

    const request = httpMock.expectOne(
      '/api/missions/3/satellites'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body)
      .toEqual(createRequest);

    request.flush({
      ...satellite,
      id: 5,
      name: createRequest.name,
      massKg: createRequest.massKg,
      altitudeKm: createRequest.altitudeKm,
      inclinationDeg: createRequest.inclinationDeg,
      eccentricity: createRequest.eccentricity
    });
  });

  it('doit modifier un satellite', () => {
    const updateRequest: SatelliteUpdateRequest = {
      name: 'FS-01 modifié',
      massKg: 875,
      altitudeKm: 520,
      inclinationDeg: 52,
      eccentricity: 0.015
    };

    service
      .update(4, updateRequest)
      .subscribe(result => {
        expect(result.name)
          .toBe(updateRequest.name);
      });

    const request = httpMock.expectOne(
      '/api/satellites/4'
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body)
      .toEqual(updateRequest);

    request.flush({
      ...satellite,
      ...updateRequest
    });
  });

  it('doit désactiver un satellite', () => {
    service.disable(4).subscribe(result => {
      expect(result.status).toBe('INACTIF');
    });

    const request = httpMock.expectOne(
      '/api/satellites/4/disable'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({
      ...satellite,
      status: 'INACTIF'
    });
  });
});
