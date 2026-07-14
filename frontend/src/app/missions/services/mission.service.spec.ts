import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  Mission,
  MissionCreateRequest,
  MissionUpdateRequest
} from '../models/mission.model';
import { MissionService } from './mission.service';

describe('MissionService', () => {
  let service: MissionService;
  let httpMock: HttpTestingController;

  const mission: Mission = {
    id: 3,
    name: 'Mission Alpha',
    description: 'Mission de démonstration',
    status: 'ACTIVE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MissionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger toutes les missions', () => {
    service.findAll().subscribe(result => {
      expect(result).toEqual([mission]);
    });

    const request = httpMock.expectOne(
      '/api/missions'
    );

    expect(request.request.method).toBe('GET');

    request.flush([mission]);
  });

  it('doit charger une mission par identifiant', () => {
    service.findById(3).subscribe(result => {
      expect(result).toEqual(mission);
    });

    const request = httpMock.expectOne(
      '/api/missions/3'
    );

    expect(request.request.method).toBe('GET');

    request.flush(mission);
  });

  it('doit créer une mission', () => {
    const createRequest: MissionCreateRequest = {
      name: 'Mission Beta',
      description: 'Nouvelle mission'
    };

    service.create(createRequest).subscribe(result => {
      expect(result.name).toBe('Mission Beta');
    });

    const request = httpMock.expectOne(
      '/api/missions'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body)
      .toEqual(createRequest);

    request.flush({
      ...mission,
      id: 4,
      name: createRequest.name,
      description: createRequest.description
    });
  });

  it('doit modifier une mission', () => {
    const updateRequest: MissionUpdateRequest = {
      name: 'Mission Alpha modifiée',
      description: 'Description modifiée'
    };

    service
      .update(3, updateRequest)
      .subscribe(result => {
        expect(result.name)
          .toBe(updateRequest.name);
      });

    const request = httpMock.expectOne(
      '/api/missions/3'
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body)
      .toEqual(updateRequest);

    request.flush({
      ...mission,
      ...updateRequest
    });
  });

  it('doit clôturer une mission', () => {
    service.close(3).subscribe(result => {
      expect(result.status).toBe('CLOTUREE');
    });

    const request = httpMock.expectOne(
      '/api/missions/3/close'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({
      ...mission,
      status: 'CLOTUREE',
      closedAt: '2026-07-14T12:00:00Z'
    });
  });

  it('doit exporter le rapport PDF de la mission', () => {
    service.exportReportPdf(3).subscribe(blob => {
      expect(blob.size).toBeGreaterThan(0);
    });

    const request = httpMock.expectOne(
      '/api/missions/3/report/pdf'
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
