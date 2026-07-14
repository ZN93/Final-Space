import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AlertService } from './alert.service';
import { Alert } from '../models/alert.model';

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;

  const alert: Alert = {
    id: 7,
    missionId: 12,
    missionName: 'Mission Alpha',
    satelliteId: 4,
    satelliteName: 'FS-01',
    metric: 'temperature',
    type: 'THRESHOLD',
    severity: 'ELEVEE',
    status: 'ACTIVE',
    message: 'Température excessive',
    createdAt: '2026-07-14T10:00:00Z',
    ackAt: null,
    ackBy: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlertService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger toutes les alertes sans paramètre de statut', () => {
    service.findByMission(12, 'ALL').subscribe(alerts => {
      expect(alerts).toEqual([alert]);
    });

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/missions/12/alerts'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.has('status')
    ).toBeFalse();

    request.flush([alert]);
  });

  it('doit charger toutes les alertes lorsque le statut est absent', () => {
    service.findByMission(12).subscribe();

    const request = httpMock.expectOne(
      '/api/missions/12/alerts'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.has('status')
    ).toBeFalse();

    request.flush([]);
  });

  it('doit filtrer les alertes actives', () => {
    service.findByMission(12, 'ACTIVE').subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/missions/12/alerts' &&
        request.params.get('status') === 'ACTIVE'
    );

    expect(request.request.method).toBe('GET');

    request.flush([alert]);
  });

  it('doit filtrer les alertes acquittées', () => {
    service.findByMission(
      12,
      'ACQUITTEE'
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/missions/12/alerts' &&
        request.params.get('status') === 'ACQUITTEE'
    );

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('doit acquitter une alerte', () => {
    const acknowledgedAlert: Alert = {
      ...alert,
      status: 'ACQUITTEE',
      ackAt: '2026-07-14T11:00:00Z',
      ackBy: 'admin@finalspace.fr'
    };

    service.acknowledge(7).subscribe(result => {
      expect(result).toEqual(acknowledgedAlert);
    });

    const request = httpMock.expectOne(
      '/api/alerts/7/ack'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush(acknowledgedAlert);
  });
});
