import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IncidentService } from './incident.service';
import {
  Incident,
  IncidentCreateRequest,
  IncidentUpdateRequest
} from '../models/incident.model';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;

  const incident: Incident = {
    id: 9,
    missionId: 3,
    missionName: 'Mission Alpha',
    satelliteId: 4,
    satelliteName: 'FS-01',
    alertId: null,
    title: 'Perte de signal',
    description: 'Signal indisponible',
    notes: null,
    severity: 'ELEVEE',
    status: 'OUVERT',
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
    closedAt: null,
    createdBy: 'admin@finalspace.fr'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IncidentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(IncidentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger tous les incidents sans filtre', () => {
    service.findByMission(3, 'ALL').subscribe(result => {
      expect(result).toEqual([incident]);
    });

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/missions/3/incidents'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.has('status')
    ).toBeFalse();

    request.flush([incident]);
  });

  it('doit charger les incidents sans statut fourni', () => {
    service.findByMission(3).subscribe();

    const request = httpMock.expectOne(
      '/api/missions/3/incidents'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.has('status')
    ).toBeFalse();

    request.flush([]);
  });

  it('doit filtrer les incidents par statut', () => {
    service.findByMission(
      3,
      'EN_COURS'
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/missions/3/incidents' &&
        request.params.get('status') === 'EN_COURS'
    );

    expect(request.request.method).toBe('GET');

    request.flush([{
      ...incident,
      status: 'EN_COURS'
    }]);
  });

  it('doit charger un incident par identifiant', () => {
    service.findById(9).subscribe(result => {
      expect(result).toEqual(incident);
    });

    const request = httpMock.expectOne(
      '/api/incidents/9'
    );

    expect(request.request.method).toBe('GET');

    request.flush(incident);
  });

  it('doit créer un incident', () => {
    const createRequest: IncidentCreateRequest = {
      satelliteId: 4,
      alertId: null,
      title: 'Perte de signal',
      description: 'Signal indisponible',
      notes: null,
      severity: 'ELEVEE'
    };

    service.create(3, createRequest).subscribe(result => {
      expect(result).toEqual(incident);
    });

    const request = httpMock.expectOne(
      '/api/missions/3/incidents'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createRequest);

    request.flush(incident);
  });

  it('doit modifier un incident', () => {
    const updateRequest: IncidentUpdateRequest = {
      title: 'Perte de signal corrigée',
      description: 'Diagnostic en cours',
      notes: 'Redémarrage effectué',
      severity: 'MOYENNE'
    };

    service.update(9, updateRequest).subscribe();

    const request = httpMock.expectOne(
      '/api/incidents/9'
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(updateRequest);

    request.flush({
      ...incident,
      ...updateRequest
    });
  });

  it('doit changer le statut d’un incident', () => {
    service.updateStatus(
      9,
      'EN_COURS'
    ).subscribe();

    const request = httpMock.expectOne(
      '/api/incidents/9/status'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      status: 'EN_COURS'
    });

    request.flush({
      ...incident,
      status: 'EN_COURS'
    });
  });

  it('doit clôturer un incident', () => {
    service.close(9).subscribe(result => {
      expect(result.status).toBe('CLOTURE');
    });

    const request = httpMock.expectOne(
      '/api/incidents/9/close'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({
      ...incident,
      status: 'CLOTURE',
      closedAt: '2026-07-14T12:00:00Z'
    });
  });
});
