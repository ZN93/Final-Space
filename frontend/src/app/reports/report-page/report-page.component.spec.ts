import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  of,
  throwError
} from 'rxjs';

import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { Satellite } from '../../satellites/models/satellite.model';
import { SatelliteService } from '../../satellites/services/satellite.service';
import { SimulationListItemResponse } from '../../simulations/models/simulation.model';
import { SimulationService } from '../../simulations/services/simulation.service';
import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { TelemetryService } from '../../telemetry/services/telemetry.service';
import { ReportPageComponent } from './report-page.component';

describe('ReportPageComponent', () => {
  let component: ReportPageComponent;
  let fixture: ComponentFixture<ReportPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let satelliteService: jasmine.SpyObj<SatelliteService>;
  let simulationService: jasmine.SpyObj<SimulationService>;
  let telemetryService: jasmine.SpyObj<TelemetryService>;
  let router: Router;

  const activeMission: Mission = {
    id: 1,
    name: 'Mission Alpha',
    description: 'Mission active',
    status: 'ACTIVE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: null
  };

  const closedMission: Mission = {
    id: 2,
    name: 'Mission clôturée',
    description: 'Mission terminée',
    status: 'CLOTUREE',
    createdAt: '2026-01-01T10:00:00Z',
    closedAt: '2026-06-01T10:00:00Z'
  };

  const activeSatellite: Satellite = {
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
  };

  const inactiveSatellite: Satellite = {
    ...activeSatellite,
    id: 11,
    name: 'Beta Sat',
    status: 'INACTIF'
  };

  const orbitSimulation: SimulationListItemResponse = {
    id: 100,
    missionId: 1,
    missionName: 'Mission Alpha',
    satelliteId: 10,
    satelliteName: 'Alpha Sat',
    type: 'ORBIT',
    status: 'SUCCESS',
    createdAt: '2026-07-14T12:00:00Z',
    createdBy: 'admin@finalspace.fr',
    inputAltitudeKm: 500,
    targetAltitudeKm: null,
    orbitalPeriodMinutes: 94.6,
    averageVelocityKmS: 7.61,
    orbitShape: 'ELLIPTICAL',
    deltaVTotalMS: null,
    transferTimeMinutes: null
  };

  const hohmannSimulation: SimulationListItemResponse = {
    id: 101,
    missionId: 1,
    missionName: 'Mission Alpha',
    satelliteId: 10,
    satelliteName: 'Alpha Sat',
    type: 'HOHMANN',
    status: 'SUCCESS',
    createdAt: '2026-07-14T13:00:00Z',
    createdBy: 'operator@finalspace.fr',
    inputAltitudeKm: 500,
    targetAltitudeKm: 800,
    orbitalPeriodMinutes: null,
    averageVelocityKmS: null,
    orbitShape: null,
    deltaVTotalMS: 195,
    transferTimeMinutes: 45
  };

  beforeEach(async () => {
    missionService = jasmine.createSpyObj<MissionService>(
      'MissionService',
      [
        'findAll',
        'exportReportPdf'
      ]
    );

    satelliteService = jasmine.createSpyObj<SatelliteService>(
      'SatelliteService',
      ['findByMission']
    );

    simulationService = jasmine.createSpyObj<SimulationService>(
      'SimulationService',
      [
        'findBySatellite',
        'exportCsv',
        'exportPdf'
      ]
    );

    telemetryService = jasmine.createSpyObj<TelemetryService>(
      'TelemetryService',
      [
        'getAvailableMetrics',
        'exportTelemetryReportCsv',
        'exportTelemetryReportPdf'
      ]
    );

    missionService.findAll.and.returnValue(of([]));
    satelliteService.findByMission.and.returnValue(of([]));
    simulationService.findBySatellite.and.returnValue(of([]));
    telemetryService.getAvailableMetrics.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReportPageComponent],
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
          provide: SimulationService,
          useValue: simulationService
        },
        {
          provide: TelemetryService,
          useValue: telemetryService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      ReportPageComponent
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

  it('doit retourner null sans mission correspondante', () => {
    component.missions = [activeMission];
    component.selectedMissionId = 999;

    expect(component.selectedMission).toBeNull();
  });

  it('doit retourner le satellite sélectionné', () => {
    component.satellites = [activeSatellite];
    component.selectedSatelliteId = activeSatellite.id;

    expect(component.selectedSatellite)
      .toEqual(activeSatellite);
  });

  it('doit retourner la simulation sélectionnée', () => {
    component.simulations = [orbitSimulation];
    component.selectedSimulationId = orbitSimulation.id;

    expect(component.selectedSimulation)
      .toEqual(orbitSimulation);
  });

  it('doit indiquer si un export est en cours', () => {
    expect(component.anyExportLoading).toBeFalse();

    component.missionExportLoading = true;

    expect(component.anyExportLoading).toBeTrue();

    component.missionExportLoading = false;
    component.telemetryCsvLoading = true;

    expect(component.anyExportLoading).toBeTrue();

    component.telemetryCsvLoading = false;
    component.telemetryPdfLoading = true;

    expect(component.anyExportLoading).toBeTrue();

    component.telemetryPdfLoading = false;
    component.simulationCsvLoading = true;

    expect(component.anyExportLoading).toBeTrue();

    component.simulationCsvLoading = false;
    component.simulationPdfLoading = true;

    expect(component.anyExportLoading).toBeTrue();
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

    expect(component.missionsLoading).toBeFalse();

    expect(component.missions.map(mission => mission.name))
      .toEqual([
        'Mission Alpha',
        'Mission clôturée'
      ]);

    expect(component.selectedMissionId)
      .toBe(activeMission.id);

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit gérer une liste de missions vide', () => {
    missionService.findAll.and.returnValue(of([]));

    component.loadMissions();

    expect(component.selectedMissionId).toBeNull();
  });

  it('doit rediriger sur une erreur 403 des missions', () => {
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

  it('doit réinitialiser le contexte au changement de mission', () => {
    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedSimulationId = orbitSimulation.id;

    component.satellites = [activeSatellite];
    component.simulations = [orbitSimulation];
    component.availableMetrics = ['temperature'];
    component.selectedMetrics = ['temperature'];

    spyOn(component, 'loadSatellites');

    component.onMissionChange();

    expect(component.satellites).toEqual([]);
    expect(component.simulations).toEqual([]);
    expect(component.availableMetrics).toEqual([]);
    expect(component.selectedMetrics).toEqual([]);
    expect(component.selectedSatelliteId).toBeNull();
    expect(component.selectedSimulationId).toBeNull();

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('ne doit pas charger de satellites sans mission', () => {
    component.selectedMissionId = null;

    component.onMissionChange();

    expect(satelliteService.findByMission)
      .not.toHaveBeenCalled();
  });

  it('doit charger et trier les satellites', () => {
    satelliteService.findByMission.and.returnValue(
      of([
        inactiveSatellite,
        activeSatellite
      ])
    );

    spyOn(component, 'loadMetrics');
    spyOn(component, 'loadSimulations');

    component.selectedMissionId = activeMission.id;

    component.loadSatellites(activeMission.id);

    expect(component.satellitesLoading).toBeFalse();

    expect(component.satellites.map(item => item.name))
      .toEqual([
        'Alpha Sat',
        'Beta Sat'
      ]);

    expect(component.selectedSatelliteId)
      .toBe(activeSatellite.id);

    expect(component.loadMetrics)
      .toHaveBeenCalledOnceWith(activeSatellite.id);

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(activeSatellite.id);
  });

  it('doit gérer une liste de satellites vide', () => {
    satelliteService.findByMission.and.returnValue(of([]));

    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedSimulationId = orbitSimulation.id;

    component.loadSatellites(activeMission.id);

    expect(component.selectedSatelliteId).toBeNull();
    expect(component.selectedSimulationId).toBeNull();
  });

  it('doit gérer une erreur 404 des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(component.errorMessage)
      .toContain('introuvable');
  });

  it('doit afficher une erreur générique des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(component.errorMessage)
      .toBe('Impossible de charger les satellites.');
  });

  it('doit réinitialiser le contexte au changement de satellite', () => {
    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedSimulationId = orbitSimulation.id;

    component.simulations = [orbitSimulation];
    component.availableMetrics = ['temperature'];
    component.selectedMetrics = ['temperature'];

    spyOn(component, 'loadMetrics');
    spyOn(component, 'loadSimulations');

    component.onSatelliteChange();

    expect(component.simulations).toEqual([]);
    expect(component.availableMetrics).toEqual([]);
    expect(component.selectedMetrics).toEqual([]);
    expect(component.selectedSimulationId).toBeNull();

    expect(component.loadMetrics)
      .toHaveBeenCalledOnceWith(activeSatellite.id);

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(activeSatellite.id);
  });

  it('ne doit pas charger de données sans satellite', () => {
    component.selectedSatelliteId = null;

    component.onSatelliteChange();

    expect(telemetryService.getAvailableMetrics)
      .not.toHaveBeenCalled();

    expect(simulationService.findBySatellite)
      .not.toHaveBeenCalled();
  });

  it('doit charger et sélectionner toutes les métriques', () => {
    telemetryService.getAvailableMetrics.and.returnValue(
      of([
        'temperature',
        'battery'
      ])
    );

    component.loadMetrics(activeSatellite.id);

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

    expect(component.metricsLoading).toBeFalse();
  });

  it('doit gérer une erreur des métriques', () => {
    telemetryService.getAvailableMetrics.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadMetrics(activeSatellite.id);

    expect(component.metricsLoading).toBeFalse();

    expect(component.errorMessage)
      .toContain('métriques');
  });

  it('doit charger les simulations de la plus récente à la plus ancienne', () => {
    simulationService.findBySatellite.and.returnValue(
      of([
        orbitSimulation,
        hohmannSimulation
      ])
    );

    component.loadSimulations(activeSatellite.id);

    expect(component.simulations.map(item => item.id))
      .toEqual([
        hohmannSimulation.id,
        orbitSimulation.id
      ]);

    expect(component.selectedSimulationId)
      .toBe(hohmannSimulation.id);

    expect(component.simulationsLoading).toBeFalse();
  });

  it('doit gérer une liste de simulations vide', () => {
    simulationService.findBySatellite.and.returnValue(
      of([])
    );

    component.loadSimulations(activeSatellite.id);

    expect(component.selectedSimulationId).toBeNull();
  });

  it('doit gérer une erreur des simulations', () => {
    simulationService.findBySatellite.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadSimulations(activeSatellite.id);

    expect(component.simulationsLoading).toBeFalse();

    expect(component.errorMessage)
      .toBe('Impossible de charger les simulations.');
  });

  it('doit rafraîchir les données du satellite en priorité', () => {
    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = activeSatellite.id;

    spyOn(component, 'loadMetrics');
    spyOn(component, 'loadSimulations');

    component.refresh();

    expect(component.loadMetrics)
      .toHaveBeenCalledOnceWith(activeSatellite.id);

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(activeSatellite.id);
  });

  it('doit rafraîchir les satellites sans satellite sélectionné', () => {
    component.selectedMissionId = activeMission.id;
    component.selectedSatelliteId = null;

    spyOn(component, 'loadSatellites');

    component.refresh();

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit rafraîchir les missions sans sélection', () => {
    component.selectedMissionId = null;
    component.selectedSatelliteId = null;

    spyOn(component, 'loadMissions');

    component.refresh();

    expect(component.loadMissions).toHaveBeenCalled();
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

  it('doit vider la sélection des métriques', () => {
    component.selectedMetrics = ['temperature'];

    component.clearMetricSelection();

    expect(component.selectedMetrics).toEqual([]);
  });

  it('doit refuser un export mission sans mission', () => {
    component.selectedMissionId = null;

    component.exportMissionReport();

    expect(component.errorMessage)
      .toContain('mission');

    expect(missionService.exportReportPdf)
      .not.toHaveBeenCalled();
  });

  it('doit exporter le rapport de mission', () => {
    component.selectedMissionId = activeMission.id;

    missionService.exportReportPdf.and.returnValue(
      of(new Blob(['pdf']))
    );

    spyOn<any>(component, 'downloadBlob');

    component.exportMissionReport();

    expect(missionService.exportReportPdf)
      .toHaveBeenCalledOnceWith(activeMission.id);

    expect(component.missionExportLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('rapport de mission');
  });

  it('doit gérer une erreur du rapport mission', () => {
    component.selectedMissionId = activeMission.id;

    missionService.exportReportPdf.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.exportMissionReport();

    expect(component.missionExportLoading).toBeFalse();

    expect(component.errorMessage)
      .toContain('rapport de mission');
  });

  it('doit refuser un export télémétrie sans satellite', () => {
    component.selectedSatelliteId = null;
    component.selectedMetrics = ['temperature'];

    component.exportTelemetry('csv');

    expect(component.errorMessage)
      .toContain('satellite');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).not.toHaveBeenCalled();
  });

  it('doit refuser un export télémétrie sans métrique', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = [];

    component.exportTelemetry('csv');

    expect(component.errorMessage)
      .toContain('métrique');
  });

  it('doit refuser une date de début invalide', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];
    component.telemetryFrom = 'date-invalide';

    component.exportTelemetry('csv');

    expect(component.errorMessage)
      .toContain('date invalide');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).not.toHaveBeenCalled();
  });

  it('doit refuser une date de fin invalide', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];
    component.telemetryTo = 'date-invalide';

    component.exportTelemetry('pdf');

    expect(component.errorMessage)
      .toContain('date invalide');
  });

  it('doit refuser une période inversée', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    component.telemetryFrom = '2026-07-15T10:00';
    component.telemetryTo = '2026-07-14T10:00';

    component.exportTelemetry('csv');

    expect(component.errorMessage)
      .toContain('date de début');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).not.toHaveBeenCalled();
  });

  it('doit exporter la télémétrie en CSV', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService
      .exportTelemetryReportCsv
      .and.returnValue(of(new Blob(['csv'])));

    spyOn<any>(component, 'downloadBlob');

    component.exportTelemetry('csv');

    expect(
      telemetryService.exportTelemetryReportCsv
    ).toHaveBeenCalledWith(
      activeSatellite.id,
      ['temperature'],
      null,
      null
    );

    expect(component.telemetryCsvLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('CSV');
  });

  it('doit exporter la télémétrie en PDF', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService
      .exportTelemetryReportPdf
      .and.returnValue(of(new Blob(['pdf'])));

    spyOn<any>(component, 'downloadBlob');

    component.exportTelemetry('pdf');

    expect(
      telemetryService.exportTelemetryReportPdf
    ).toHaveBeenCalled();

    expect(component.telemetryPdfLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('PDF');
  });

  it('doit convertir les dates de télémétrie en ISO', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    component.telemetryFrom = '2026-07-14T10:00';
    component.telemetryTo = '2026-07-14T12:00';

    telemetryService
      .exportTelemetryReportCsv
      .and.returnValue(of(new Blob(['csv'])));

    spyOn<any>(component, 'downloadBlob');

    component.exportTelemetry('csv');

    const args =
      telemetryService
        .exportTelemetryReportCsv
        .calls.mostRecent().args;

    expect(args[2]).toContain('2026-07-14');
    expect(args[3]).toContain('2026-07-14');
  });

  it('doit gérer une erreur 400 textuelle de télémétrie', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService
      .exportTelemetryReportCsv
      .and.returnValue(
        throwError(() => ({
          status: 400,
          error: 'Période invalide'
        }))
      );

    component.exportTelemetry('csv');

    expect(component.errorMessage)
      .toBe('Période invalide');
  });

  it('doit gérer une erreur générique de télémétrie', () => {
    component.selectedSatelliteId = activeSatellite.id;
    component.selectedMetrics = ['temperature'];

    telemetryService
      .exportTelemetryReportPdf
      .and.returnValue(
        throwError(() => ({
          status: 500
        }))
      );

    component.exportTelemetry('pdf');

    expect(component.errorMessage)
      .toContain('télémétrie PDF');
  });

  it('doit refuser un export sans simulation', () => {
    component.selectedSimulationId = null;

    component.exportSimulation('csv');

    expect(component.errorMessage)
      .toContain('simulation');

    expect(simulationService.exportCsv)
      .not.toHaveBeenCalled();
  });

  it('doit exporter une simulation en CSV', () => {
    component.selectedSimulationId = orbitSimulation.id;

    simulationService.exportCsv.and.returnValue(
      of(new Blob(['csv']))
    );

    spyOn<any>(component, 'downloadBlob');

    component.exportSimulation('csv');

    expect(simulationService.exportCsv)
      .toHaveBeenCalledOnceWith(orbitSimulation.id);

    expect(component.simulationCsvLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('CSV');
  });

  it('doit exporter une simulation en PDF', () => {
    component.selectedSimulationId = orbitSimulation.id;

    simulationService.exportPdf.and.returnValue(
      of(new Blob(['pdf']))
    );

    spyOn<any>(component, 'downloadBlob');

    component.exportSimulation('pdf');

    expect(simulationService.exportPdf)
      .toHaveBeenCalledOnceWith(orbitSimulation.id);

    expect(component.simulationPdfLoading).toBeFalse();

    expect(component.successMessage)
      .toContain('PDF');
  });

  it('doit gérer une erreur d’export simulation', () => {
    component.selectedSimulationId = orbitSimulation.id;

    simulationService.exportCsv.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.exportSimulation('csv');

    expect(component.simulationCsvLoading).toBeFalse();

    expect(component.errorMessage)
      .toContain('simulation CSV');
  });

  it('doit retourner les libellés de simulation', () => {
    expect(component.getSimulationTypeLabel('ORBIT'))
      .toBe('Simulation orbitale');

    expect(component.getSimulationTypeLabel('HOHMANN'))
      .toBe('Transfert de Hohmann');
  });

  it('doit résumer une simulation orbitale', () => {
    const result = component.getSimulationSummary(
      orbitSimulation
    );

    expect(result).toContain('94');
    expect(result).toContain('7');
  });

  it('doit résumer une simulation Hohmann', () => {
    const result = component.getSimulationSummary(
      hohmannSimulation
    );

    expect(result).toContain('195');
    expect(result).toContain('45');
  });

  it('doit gérer les données orbitales absentes', () => {
    const simulation: SimulationListItemResponse = {
      ...orbitSimulation,
      orbitalPeriodMinutes: null,
      averageVelocityKmS: null
    };

    expect(
      component.getSimulationSummary(simulation)
    ).toContain('Non disponible');
  });

  it('doit gérer les données Hohmann absentes', () => {
    const simulation: SimulationListItemResponse = {
      ...hohmannSimulation,
      deltaVTotalMS: null,
      transferTimeMinutes: null
    };

    expect(
      component.getSimulationSummary(simulation)
    ).toContain('Non disponible');
  });

  it('doit formater une date valide', () => {
    expect(
      component.formatDate('2026-07-14T10:00:00Z')
    ).not.toBe('2026-07-14T10:00:00Z');
  });

  it('doit conserver une date invalide', () => {
    expect(component.formatDate('date-invalide'))
      .toBe('date-invalide');
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
      component.trackBySimulationId(
        0,
        orbitSimulation
      )
    ).toBe(orbitSimulation.id);
  });
});
