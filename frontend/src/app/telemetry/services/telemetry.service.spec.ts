import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TelemetryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TelemetryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit importer un fichier CSV', () => {
    const file = new File(
      ['timestamp,metric,value'],
      'telemetry.csv',
      { type: 'text/csv' }
    );

    service.importCsv(
      3,
      4,
      file
    ).subscribe(response => {
      expect(response.importedCount).toBe(1);
      expect(response.errorCount).toBe(0);
    });

    const request = httpMock.expectOne(
      '/api/missions/3/satellites/4/telemetry/import'
    );

    expect(request.request.method).toBe('POST');
    expect(
      request.request.body instanceof FormData
    ).toBeTrue();

    expect(
      request.request.body.get('file')
    ).toBe(file);

    request.flush({
      importId: 'import-1',
      importedCount: 1,
      errorCount: 0,
      errors: []
    });
  });

  it('doit charger les métriques disponibles', () => {
    service.getAvailableMetrics(4).subscribe(metrics => {
      expect(metrics).toEqual([
        'temperature',
        'battery'
      ]);
    });

    const request = httpMock.expectOne(
      '/api/satellites/4/telemetry/metrics'
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      'temperature',
      'battery'
    ]);
  });

  it('doit charger la télémétrie avec métriques, dates et limite', () => {
    service.getTelemetry(
      4,
      ['temperature', 'battery'],
      '2026-07-14T10:00:00Z',
      '2026-07-14T11:00:00Z',
      250
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/satellites/4/telemetry'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.getAll('metric')
    ).toEqual([
      'temperature',
      'battery'
    ]);
    expect(
      request.request.params.get('from')
    ).toBe('2026-07-14T10:00:00Z');
    expect(
      request.request.params.get('to')
    ).toBe('2026-07-14T11:00:00Z');
    expect(
      request.request.params.get('limit')
    ).toBe('250');

    request.flush({
      satelliteId: 4,
      metrics: ['temperature', 'battery'],
      count: 0,
      points: []
    });
  });

  it('doit charger la télémétrie sans période', () => {
    service.getTelemetry(
      4,
      ['temperature']
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/satellites/4/telemetry'
    );

    expect(
      request.request.params.has('from')
    ).toBeFalse();
    expect(
      request.request.params.has('to')
    ).toBeFalse();
    expect(
      request.request.params.get('limit')
    ).toBe('5000');

    request.flush({
      satelliteId: 4,
      metrics: ['temperature'],
      count: 0,
      points: []
    });
  });

  it('doit lancer la détection des anomalies', () => {
    service.detectAnomalies(
      4,
      ['temperature'],
      '2026-07-14T10:00:00Z',
      '2026-07-14T11:00:00Z'
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url ===
          '/api/satellites/4/anomalies/detect'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(
      request.request.params.getAll('metric')
    ).toEqual(['temperature']);
    expect(
      request.request.params.get('from')
    ).toBe('2026-07-14T10:00:00Z');
    expect(
      request.request.params.get('to')
    ).toBe('2026-07-14T11:00:00Z');

    request.flush({
      satelliteId: 4,
      detectedCount: 0,
      savedCount: 0,
      anomalies: []
    });
  });

  it('doit charger les anomalies sans filtre', () => {
    service.getAnomalies(4).subscribe();

    const request = httpMock.expectOne(
      '/api/satellites/4/anomalies'
    );

    expect(request.request.method).toBe('GET');
    expect(
      request.request.params.has('metric')
    ).toBeFalse();
    expect(
      request.request.params.has('from')
    ).toBeFalse();
    expect(
      request.request.params.has('to')
    ).toBeFalse();

    request.flush({
      satelliteId: 4,
      count: 0,
      anomalies: []
    });
  });

  it('doit charger les anomalies avec filtres', () => {
    service.getAnomalies(
      4,
      ['temperature'],
      '2026-07-14T10:00:00Z',
      '2026-07-14T11:00:00Z'
    ).subscribe();

    const request = httpMock.expectOne(
      request =>
        request.url === '/api/satellites/4/anomalies'
    );

    expect(
      request.request.params.getAll('metric')
    ).toEqual(['temperature']);
    expect(
      request.request.params.get('from')
    ).toBe('2026-07-14T10:00:00Z');
    expect(
      request.request.params.get('to')
    ).toBe('2026-07-14T11:00:00Z');

    request.flush({
      satelliteId: 4,
      count: 0,
      anomalies: []
    });
  });

  it('doit exporter le rapport CSV', () => {
    service.exportTelemetryReportCsv(
      4,
      ['temperature'],
      '2026-07-14T10:00:00Z',
      '2026-07-14T11:00:00Z'
    ).subscribe(blob => {
      expect(blob.size).toBeGreaterThan(0);
    });

    const request = httpMock.expectOne(
      request =>
        request.url ===
          '/api/satellites/4/telemetry/report/csv'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    expect(
      request.request.params.getAll('metric')
    ).toEqual(['temperature']);

    request.flush(
      new Blob(['csv-content'], {
        type: 'text/csv'
      })
    );
  });

  it('doit exporter le rapport PDF', () => {
    service.exportTelemetryReportPdf(
      4,
      ['temperature']
    ).subscribe(blob => {
      expect(blob.size).toBeGreaterThan(0);
    });

    const request = httpMock.expectOne(
      request =>
        request.url ===
          '/api/satellites/4/telemetry/report/pdf'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    expect(
      request.request.params.has('from')
    ).toBeFalse();
    expect(
      request.request.params.has('to')
    ).toBeFalse();

    request.flush(
      new Blob(['pdf-content'], {
        type: 'application/pdf'
      })
    );
  });
});
