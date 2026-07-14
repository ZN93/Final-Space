import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  of,
  throwError
} from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { MissionService } from '../../missions/services/mission.service';
import { SatelliteService } from '../../satellites/services/satellite.service';
import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { TelemetryService } from '../services/telemetry.service';
import { TelemetryPageComponent } from './telemetry-page.component';

describe('TelemetryPageComponent', () => {
  let component: TelemetryPageComponent;
  let fixture: ComponentFixture<TelemetryPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let satelliteService: jasmine.SpyObj<SatelliteService>;
  let telemetryService: jasmine.SpyObj<TelemetryService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const activeMission = {
    id: 1,
    name: 'Mission Alpha',
    description: 'Mission active',
    status: 'ACTIVE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: null
  } as any;

  const closedMission = {
    ...activeMission,
    id: 2,
    name: 'Mission clôturée',
    status: 'CLOTUREE'
  } as any;

  const activeSatellite = {
    id: 10,
    name: 'Alpha Sat',
    status: 'ACTIF',
    massKg: 850,
    altitudeKm: 500,
    inclinationDeg: 51.6,
    eccentricity: 0.01,
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
    missionId: 1,
    missionName: 'Mission Alpha'
  } as any;

  const inactiveSatellite = {
    ...activeSatellite,
    id: 11,
    name: 'Beta Sat',
    status: 'INACTIF'
  } as any;

  const telemetryPoints = [
    {
      timestamp: '2026-07-14T10:00:00Z',
      metric: 'temperature',
      value: 20,
      unit: '°C'
    },
    {
      timestamp: '2026-07-14T11:00:00Z',
      metric: 'temperature',
      value: 30,
      unit: '°C'
    },
    {
      timestamp: '2026-07-14T10:30:00Z',
      metric: 'battery',
      value: 90,
      unit: '%'
    }
  ] as any[];

  const anomalies = [
    {
      id: 'a1',
      satelliteId: 10,
      metric: 'temperature',
      timestamp: '2026-07-14T12:00:00Z',
      value: 100,
      type: 'THRESHOLD',
      severity: 'ELEVEE',
      message: 'Température critique'
    },
    {
      id: 'a2',
      satelliteId: 10,
      metric: 'battery',
      timestamp: '2026-07-14T11:00:00Z',
      value: 20,
      type: 'VARIATION',
      severity: 'MOYENNE',
      message: 'Variation rapide'
    },
    {
      id: 'a3',
      satelliteId: 10,
      metric: 'signal',
      timestamp: '2026-07-14T10:00:00Z',
      value: 0,
      type: 'MISSING',
      severity: 'FAIBLE',
      message: 'Donnée manquante'
    }
  ] as any[];

  beforeEach(async () => {
    missionService = jasmine.createSpyObj(
      'MissionService',
      ['findAll']
    );

    satelliteService = jasmine.createSpyObj(
      'SatelliteService',
      ['findByMission']
    );

    telemetryService = jasmine.createSpyObj(
      'TelemetryService',
      [
        'getAvailableMetrics',
        'getTelemetry',
        'getAnomalies',
        'detectAnomalies',
        'importCsv',
        'exportTelemetryReportCsv',
        'exportTelemetryReportPdf'
      ]
    );

    authService = jasmine.createSpyObj(
      'AuthService',
      [
        'isAdmin',
        'isOperateur'
      ]
    );

    missionService.findAll.and.returnValue(of([]));
    satelliteService.findByMission.and.returnValue(of([]));
    telemetryService.getAvailableMetrics.and.returnValue(of([]));

    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [TelemetryPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        {
          provide: MissionService,
          useValue: missionService
        },
        {
          provide: SatelliteService,
          useValue: satelliteService
        },
        {
          provide: TelemetryService,
          useValue: telemetryService
        },
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      TelemetryPageComponent
    );

    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit retourner la mission sélectionnée', () => {
    component.missions = [activeMission];
    component.selectedMissionId = activeMission.id;

    expect(component.selectedMission)
      .toEqual(activeMission);
  });

  it('doit retourner le satellite sélectionné', () => {
    component.satellites = [activeSatellite];
    component.selectedSatelliteId = activeSatellite.id;

    expect(component.selectedSatellite)
      .toEqual(activeSatellite);
  });

  it('doit autoriser la gestion à un administrateur', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser la gestion à un opérateur', () => {
    authService.isOperateur.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser la modification pour une mission et un satellite actifs', () => {
    prepareActiveContext();

    expect(component.canModifyTelemetry).toBeTrue();
  });

  it('doit refuser la modification pour une mission clôturée', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [closedMission];
    component.satellites = [activeSatellite];

    component.selectedMissionId = closedMission.id;
    component.selectedSatelliteId = activeSatellite.id;

    expect(component.canModifyTelemetry).toBeFalse();
  });

  it('doit refuser la modification pour un satellite inactif', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [activeMission];
    component.satellites = [inactiveSatellite];

    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = inactiveSatellite.id;

    expect(component.canModifyTelemetry).toBeFalse();
  });

  it('doit détecter la présence de métriques', () => {
    component.availableMetrics = ['temperature'];

    expect(component.hasMetrics).toBeTrue();

    component.availableMetrics = [];

    expect(component.hasMetrics).toBeFalse();
  });

  it('doit compter les anomalies par gravité', () => {
    component.anomalies = anomalies;

    expect(component.criticalAnomalyCount).toBe(1);
    expect(component.mediumAnomalyCount).toBe(1);
    expect(component.lowAnomalyCount).toBe(1);
  });

  it('doit charger et trier les missions', () => {
    missionService.findAll.and.returnValue(
      of([
        closedMission,
        activeMission
      ])
    );

    spyOn(component, 'loadSatellites');

    component.loadMissions();

    expect(component.missions.map(item => item.name))
      .toEqual([
        'Mission Alpha',
        'Mission clôturée'
      ]);

    expect(component.selectedMissionId)
      .toBe(activeMission.id);

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit gérer une erreur 403 des missions', () => {
    missionService.findAll.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.loadMissions();

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
  });

  it('doit afficher une erreur générique des missions', () => {
    missionService.findAll.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadMissions();

    expect(component.errorMessage)
      .toBe('Impossible de charger les missions.');
  });

  it('doit charger et trier les satellites', () => {
    satelliteService.findByMission.and.returnValue(
      of([
        inactiveSatellite,
        activeSatellite
      ])
    );

    spyOn(component, 'loadMetrics');

    component.selectedMissionId = activeMission.id;

    component.loadSatellites(activeMission.id);

    expect(component.satellites.map(item => item.name))
      .toEqual([
        'Alpha Sat',
        'Beta Sat'
      ]);

    expect(component.selectedSatelliteId)
      .toBe(activeSatellite.id);

    expect(component.loadMetrics)
      .toHaveBeenCalled();
  });

  it('doit gérer une liste de satellites vide', () => {
    satelliteService.findByMission.and.returnValue(of([]));

    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = 10;
    component.availableMetrics = ['temperature'];

    component.loadSatellites(activeMission.id);

    expect(component.selectedSatelliteId).toBeNull();
    expect(component.availableMetrics).toEqual([]);
  });

  it('doit afficher une erreur 404 des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(component.errorMessage)
      .toContain('introuvable');
  });

  it('doit charger et trier les métriques', () => {
    component.selectedSatelliteId = activeSatellite.id;

    telemetryService.getAvailableMetrics.and.returnValue(
      of([
        'temperature',
        'battery'
      ])
    );

    spyOn(component, 'refreshTelemetry');
    spyOn(component, 'loadAnomalies');

    component.loadMetrics();

    expect(component.availableMetrics)
      .toEqual([
        'battery',
        'temperature'
      ]);

    expect(component.selectedMetrics)
      .toEqual([
        'battery',
        'temperature'
      ]);

    expect(component.refreshTelemetry)
      .toHaveBeenCalled();

    expect(component.loadAnomalies)
      .toHaveBeenCalled();
  });

  it('ne doit rien charger sans satellite sélectionné', () => {
    component.selectedSatelliteId = null;

    component.loadMetrics();

    expect(telemetryService.getAvailableMetrics)
      .not.toHaveBeenCalled();
  });

  it('doit ajouter une métrique cochée', () => {
    component.selectedMetrics = ['temperature'];

    component.toggleMetric(
      'battery',
      {
        target: {
          checked: true
        }
      } as any
    );

    expect(component.selectedMetrics)
      .toEqual([
        'temperature',
        'battery'
      ]);
  });

  it('doit retirer une métrique décochée', () => {
    component.selectedMetrics = [
      'temperature',
      'battery'
    ];

    component.toggleMetric(
      'battery',
      {
        target: {
          checked: false
        }
      } as any
    );

    expect(component.selectedMetrics)
      .toEqual(['temperature']);
  });

  it('doit indiquer si une métrique est sélectionnée', () => {
    component.selectedMetrics = ['temperature'];

    expect(
      component.isMetricSelected('temperature')
    ).toBeTrue();

    expect(
      component.isMetricSelected('battery')
    ).toBeFalse();
  });

  it('doit sélectionner toutes les métriques', () => {
    component.availableMetrics = [
      'temperature',
      'battery'
    ];

    component.selectAllMetrics();

    expect(component.selectedMetrics)
      .toEqual([
        'temperature',
        'battery'
      ]);
  });

  it('doit vider les métriques et le graphique', () => {
    component.selectedMetrics = ['temperature'];
    component.telemetryPoints = telemetryPoints;
    component.chartSeries = [
      {
        metric: 'temperature',
        path: 'M 0 0',
        points: []
      }
    ];

    component.clearMetricSelection();

    expect(component.selectedMetrics).toEqual([]);
    expect(component.telemetryPoints).toEqual([]);
    expect(component.chartSeries).toEqual([]);
  });

  it('doit refuser le chargement sans métrique', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = [];

    component.refreshTelemetry();

    expect(component.errorMessage)
      .toContain('métrique');

    expect(telemetryService.getTelemetry)
      .not.toHaveBeenCalled();
  });

  it('doit refuser une période inversée', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    component.telemetryFrom = '2026-07-15T10:00';
    component.telemetryTo = '2026-07-14T10:00';

    component.refreshTelemetry();

    expect(component.errorMessage)
      .toContain('date de début');

    expect(telemetryService.getTelemetry)
      .not.toHaveBeenCalled();
  });

  it('doit charger la télémétrie et construire le graphique', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = [
      'temperature',
      'battery'
    ];

    telemetryService.getTelemetry.and.returnValue(
      of({
        satelliteId: activeSatellite.id,
        metrics: component.selectedMetrics,
        count: telemetryPoints.length,
        points: telemetryPoints
      } as any)
    );

    component.refreshTelemetry();

    expect(component.telemetryPoints)
      .toEqual(telemetryPoints);

    expect(component.chartSeries.length).toBe(2);

    expect(component.chartSeries[0].path)
      .toContain('M');

    expect(component.telemetryLoading).toBeFalse();
  });

  it('doit gérer un graphique sans point', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.getTelemetry.and.returnValue(
      of({
        satelliteId: activeSatellite.id,
        metrics: ['temperature'],
        count: 0,
        points: []
      } as any)
    );

    component.refreshTelemetry();

    expect(component.chartSeries).toEqual([]);
  });

  it('doit gérer des valeurs et dates identiques dans le graphique', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.getTelemetry.and.returnValue(
      of({
        satelliteId: activeSatellite.id,
        metrics: ['temperature'],
        count: 1,
        points: [
          {
            timestamp: '2026-07-14T10:00:00Z',
            metric: 'temperature',
            value: 20,
            unit: '°C'
          }
        ]
      } as any)
    );

    component.refreshTelemetry();

    expect(component.chartSeries.length).toBe(1);
    expect(component.chartSeries[0].points.length).toBe(1);
  });

  it('doit charger et trier les anomalies', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.getAnomalies.and.returnValue(
      of({
        satelliteId: activeSatellite.id,
        count: anomalies.length,
        anomalies: [
          anomalies[2],
          anomalies[0],
          anomalies[1]
        ]
      } as any)
    );

    component.loadAnomalies();

    expect(component.anomalies.map(item => item.id))
      .toEqual([
        'a1',
        'a2',
        'a3'
      ]);

    expect(component.anomaliesLoading).toBeFalse();
  });

  it('doit lancer le rafraîchissement complet', () => {
    spyOn(component, 'refreshTelemetry');
    spyOn(component, 'loadAnomalies');

    component.refreshAll();

    expect(component.refreshTelemetry).toHaveBeenCalled();
    expect(component.loadAnomalies).toHaveBeenCalled();
  });

  it('doit refuser la détection sans permission', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    component.detectAnomalies();

    expect(telemetryService.detectAnomalies)
      .not.toHaveBeenCalled();
  });

  it('doit refuser la détection sans métrique', () => {
    prepareActiveContext();

    component.selectedMetrics = [];

    component.detectAnomalies();

    expect(component.errorMessage)
      .toContain('métrique');

    expect(telemetryService.detectAnomalies)
      .not.toHaveBeenCalled();
  });

  it('doit détecter les anomalies', () => {
    prepareActiveContext();

    component.selectedMetrics = ['temperature'];

    telemetryService.detectAnomalies.and.returnValue(
      of({
        satelliteId: activeSatellite.id,
        detectedCount: 3,
        savedCount: 2,
        anomalies: []
      } as any)
    );

    spyOn(component, 'loadAnomalies');

    component.detectAnomalies();

    expect(telemetryService.detectAnomalies)
      .toHaveBeenCalled();

    expect(component.successMessage)
      .toContain('3');

    expect(component.successMessage)
      .toContain('2');

    expect(component.loadAnomalies)
      .toHaveBeenCalled();

    expect(component.anomalyDetecting).toBeFalse();
  });

  it('doit sélectionner un fichier', () => {
    const file = new File(
      ['content'],
      'telemetry.csv',
      {
        type: 'text/csv'
      }
    );

    component.onFileSelected({
      target: {
        files: [file]
      }
    } as any);

    expect(component.selectedFile).toBe(file);
    expect(component.importErrors).toEqual([]);
    expect(component.importResult).toBeNull();
  });

  it('doit refuser un import sans fichier', () => {
    prepareActiveContext();

    component.selectedFile = null;

    component.importCsv();

    expect(component.errorMessage)
      .toContain('fichier CSV');

    expect(telemetryService.importCsv)
      .not.toHaveBeenCalled();
  });

  it('doit refuser un fichier non CSV', () => {
    prepareActiveContext();

    component.selectedFile = new File(
      ['content'],
      'telemetry.txt'
    );

    component.importCsv();

    expect(component.errorMessage)
      .toContain('format CSV');

    expect(telemetryService.importCsv)
      .not.toHaveBeenCalled();
  });

  it('doit importer un fichier CSV', () => {
    prepareActiveContext();

    const file = new File(
      ['content'],
      'telemetry.csv',
      {
        type: 'text/csv'
      }
    );

    component.selectedFile = file;

    telemetryService.importCsv.and.returnValue(
      of({
        importId: 'import-1',
        importedCount: 5,
        errorCount: 0,
        errors: []
      } as any)
    );

    spyOn(component, 'loadMetrics');

    component.importCsv();

    expect(telemetryService.importCsv)
      .toHaveBeenCalledOnceWith(
        activeMission.id,
        activeSatellite.id,
        file
      );

    expect(component.importResult?.importedCount)
      .toBe(5);

    expect(component.selectedFile).toBeNull();

    expect(component.loadMetrics)
      .toHaveBeenCalled();
  });

  it('doit afficher les erreurs détaillées d’un CSV invalide', () => {
    prepareActiveContext();

    component.selectedFile = new File(
      ['invalid'],
      'telemetry.csv'
    );

    const errors = [
      {
        line: 2,
        message: 'Valeur invalide'
      }
    ];

    telemetryService.importCsv.and.returnValue(
      throwError(() => ({
        status: 400,
        error: {
          errors
        }
      }))
    );

    component.importCsv();

    expect(component.importErrors)
      .toEqual(errors as any);

    expect(component.errorMessage)
      .toContain('contient des erreurs');
  });

  it('doit refuser un export sans métrique', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = [];

    component.exportReport('csv');

    expect(component.errorMessage)
      .toContain('métrique');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).not.toHaveBeenCalled();
  });

  it('doit exporter un rapport CSV', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.exportTelemetryReportCsv.and.returnValue(
      of(new Blob(['csv']))
    );

    spyOn<any>(component, 'downloadBlob');

    component.exportReport('csv');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).toHaveBeenCalled();

    expect(component.csvExportLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('CSV');
  });

  it('doit exporter un rapport PDF', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.exportTelemetryReportPdf.and.returnValue(
      of(new Blob(['pdf']))
    );

    spyOn<any>(component, 'downloadBlob');

    component.exportReport('pdf');

    expect(
      telemetryService.exportTelemetryReportPdf
    ).toHaveBeenCalled();

    expect(component.pdfExportLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('PDF');
  });

  it('doit gérer une erreur d’export', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService.exportTelemetryReportCsv.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.exportReport('csv');

    expect(component.csvExportLoading).toBeFalse();

    expect(component.errorMessage)
      .toContain('export CSV');
  });

  it('doit retourner les couleurs en boucle', () => {
    expect(component.getSeriesStroke(0))
      .toBe('#38bdf8');

    expect(component.getSeriesStroke(6))
      .toBe('#38bdf8');
  });

  it('doit retourner les libellés des anomalies', () => {
    expect(component.getAnomalyTypeLabel('THRESHOLD'))
      .toContain('seuil');

    expect(component.getAnomalyTypeLabel('VARIATION'))
      .toContain('Variation');

    expect(component.getAnomalyTypeLabel('MISSING'))
      .toContain('manquantes');
  });

  it('doit retourner les libellés de gravité', () => {
    expect(component.getSeverityLabel('FAIBLE'))
      .toBe('Faible');

    expect(component.getSeverityLabel('MOYENNE'))
      .toBe('Moyenne');

    expect(component.getSeverityLabel('ELEVEE'))
      .toContain('lev');
  });

  it('doit formater une date valide', () => {
    expect(
      component.formatDate('2026-07-14T10:00:00Z')
    ).not.toBe('2026-07-14T10:00:00Z');
  });

  it('doit conserver une date invalide', () => {
    expect(component.formatDate('invalide'))
      .toBe('invalide');
  });

  it('doit retourner les valeurs trackBy', () => {
    expect(
      component.trackByMissionId(0, activeMission)
    ).toBe(activeMission.id);

    expect(
      component.trackBySatelliteId(0, activeSatellite)
    ).toBe(activeSatellite.id);

    expect(
      component.trackByMetric(0, 'temperature')
    ).toBe('temperature');

    expect(
      component.trackByAnomalyId(0, anomalies[0])
    ).toBe('a1');
  });

  function prepareActiveContext(): void {
    authService.isAdmin.and.returnValue(true);
    authService.isOperateur.and.returnValue(false);

    component.missions = [activeMission];
    component.satellites = [activeSatellite];

    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = activeSatellite.id;
  }
});
