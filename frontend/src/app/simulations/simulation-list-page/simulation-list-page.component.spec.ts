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
import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { Satellite } from '../../satellites/models/satellite.model';
import { SatelliteService } from '../../satellites/services/satellite.service';
import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import {
  SimulationListItemResponse,
  SimulationResponse
} from '../models/simulation.model';
import { SimulationService } from '../services/simulation.service';
import { SimulationListPageComponent } from './simulation-list-page.component';

describe('SimulationListPageComponent', () => {
  let component: SimulationListPageComponent;
  let fixture: ComponentFixture<SimulationListPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let satelliteService: jasmine.SpyObj<SatelliteService>;
  let simulationService: jasmine.SpyObj<SimulationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mission: Mission = {
    id: 2,
    name: 'Mission Alpha',
    description: 'Mission active',
    status: 'ACTIVE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: null
  };

  const closedMission: Mission = {
    ...mission,
    id: 3,
    name: 'Mission clôturée',
    status: 'CLOTUREE',
    closedAt: '2026-07-14T11:00:00Z'
  };

  const satellite: Satellite = {
    id: 10,
    name: 'Alpha Sat',
    status: 'ACTIF',
    massKg: 850,
    altitudeKm: 500,
    inclinationDeg: 51.6,
    eccentricity: 0.01,
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
    missionId: 2,
    missionName: 'Mission Alpha'
  };

  const inactiveSatellite: Satellite = {
    ...satellite,
    id: 11,
    name: 'Inactive Sat',
    status: 'INACTIF'
  };

  const orbitSimulation: SimulationListItemResponse = {
    id: 100,
    missionId: 2,
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
    missionId: 2,
    missionName: 'Mission Alpha',
    satelliteId: 10,
    satelliteName: 'Alpha Sat',
    type: 'HOHMANN',
    status: 'FAILED',
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

  const orbitResponse: SimulationResponse = {
    id: 102,
    missionId: 2,
    missionName: 'Mission Alpha',
    satelliteId: 10,
    satelliteName: 'Alpha Sat',
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
    createdAt: '2026-07-14T14:00:00Z',
    createdBy: 'admin@finalspace.fr'
  };

  const hohmannResponse: SimulationResponse = {
    ...orbitResponse,
    id: 103,
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

  beforeEach(async () => {
    missionService = jasmine.createSpyObj<MissionService>(
      'MissionService',
      ['findAll']
    );

    satelliteService = jasmine.createSpyObj<SatelliteService>(
      'SatelliteService',
      ['findByMission']
    );

    simulationService = jasmine.createSpyObj<SimulationService>(
      'SimulationService',
      [
        'findBySatellite',
        'launchOrbitSimulation',
        'launchHohmannTransfer'
      ]
    );

    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      [
        'isAdmin',
        'isOperateur'
      ]
    );

    missionService.findAll.and.returnValue(of([]));
    satelliteService.findByMission.and.returnValue(of([]));
    simulationService.findBySatellite.and.returnValue(of([]));

    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [SimulationListPageComponent],
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
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      SimulationListPageComponent
    );

    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit retourner la mission sélectionnée', () => {
    component.missions = [mission];
    component.selectedMissionId = mission.id;

    expect(component.selectedMission).toEqual(mission);
  });

  it('doit retourner le satellite sélectionné', () => {
    component.satellites = [satellite];
    component.selectedSatelliteId = satellite.id;

    expect(component.selectedSatellite).toEqual(satellite);
  });

  it('doit filtrer par texte', () => {
    component.simulations = [
      orbitSimulation,
      hohmannSimulation
    ];

    component.searchTerm = 'operator';

    expect(component.filteredSimulations)
      .toEqual([hohmannSimulation]);
  });

  it('doit filtrer par type', () => {
    component.simulations = [
      orbitSimulation,
      hohmannSimulation
    ];

    component.typeFilter = 'ORBIT';

    expect(component.filteredSimulations)
      .toEqual([orbitSimulation]);
  });

  it('doit filtrer par statut', () => {
    component.simulations = [
      orbitSimulation,
      hohmannSimulation
    ];

    component.statusFilter = 'FAILED';

    expect(component.filteredSimulations)
      .toEqual([hohmannSimulation]);
  });

  it('doit calculer les compteurs', () => {
    component.simulations = [
      orbitSimulation,
      hohmannSimulation
    ];

    expect(component.successCount).toBe(1);
    expect(component.failedCount).toBe(1);
    expect(component.orbitCount).toBe(1);
    expect(component.hohmannCount).toBe(1);
  });

  it('doit autoriser la gestion à un administrateur', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser la gestion à un opérateur', () => {
    authService.isOperateur.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser le lancement sur une mission et un satellite actifs', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [mission];
    component.satellites = [satellite];

    component.selectedMissionId = mission.id;
    component.selectedSatelliteId = satellite.id;

    expect(component.canLaunchSimulation).toBeTrue();
  });

  it('doit refuser le lancement sur une mission clôturée', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [closedMission];
    component.satellites = [satellite];

    component.selectedMissionId = closedMission.id;
    component.selectedSatelliteId = satellite.id;

    expect(component.canLaunchSimulation).toBeFalse();
  });

  it('doit refuser le lancement sur un satellite inactif', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [mission];
    component.satellites = [inactiveSatellite];

    component.selectedMissionId = mission.id;
    component.selectedSatelliteId = inactiveSatellite.id;

    expect(component.canLaunchSimulation).toBeFalse();
  });

  it('doit calculer si un lancement est en cours', () => {
    component.launchingOrbit = true;
    component.launchingHohmann = false;

    expect(component.launchInProgress).toBeTrue();

    component.launchingOrbit = false;
    component.launchingHohmann = false;

    expect(component.launchInProgress).toBeFalse();
  });

  it('doit charger les missions et sélectionner la mission active', () => {
    missionService.findAll.and.returnValue(
      of([
        closedMission,
        mission
      ])
    );

    spyOn(component, 'loadSatellites');

    component.loadMissions();

    expect(component.missionsLoading).toBeFalse();
    expect(component.selectedMissionId).toBe(mission.id);

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(mission.id);
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

  it('doit charger les satellites et sélectionner le satellite actif', () => {
    satelliteService.findByMission.and.returnValue(
      of([
        inactiveSatellite,
        satellite
      ])
    );

    spyOn(component, 'loadSimulations');

    component.selectedMissionId = mission.id;

    component.loadSatellites(mission.id);

    expect(component.satellitesLoading).toBeFalse();
    expect(component.selectedSatelliteId).toBe(satellite.id);

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(satellite.id);
  });

  it('doit gérer une liste de satellites vide', () => {
    satelliteService.findByMission.and.returnValue(of([]));

    component.selectedMissionId = mission.id;
    component.simulations = [orbitSimulation];

    component.loadSatellites(mission.id);

    expect(component.selectedSatelliteId).toBeNull();
    expect(component.simulations).toEqual([]);
  });

  it('doit afficher Mission introuvable pour une erreur 404 des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadSatellites(mission.id);

    expect(component.errorMessage)
      .toBe('Mission introuvable.');
  });

  it('doit charger et trier les simulations de la plus récente à la plus ancienne', () => {
    simulationService.findBySatellite.and.returnValue(
      of([
        orbitSimulation,
        hohmannSimulation
      ])
    );

    component.loadSimulations(satellite.id);

    expect(component.simulationsLoading).toBeFalse();

    expect(component.simulations.map(simulation => simulation.id))
      .toEqual([
        hohmannSimulation.id,
        orbitSimulation.id
      ]);
  });

  it('doit afficher Satellite introuvable pour une erreur 404', () => {
    simulationService.findBySatellite.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadSimulations(satellite.id);

    expect(component.errorMessage)
      .toBe('Satellite introuvable.');
  });

  it('doit afficher une erreur générique de simulation', () => {
    simulationService.findBySatellite.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadSimulations(satellite.id);

    expect(component.errorMessage)
      .toBe('Impossible de charger les simulations.');
  });

  it('doit recharger les simulations en priorité', () => {
    component.selectedMissionId = mission.id;
    component.selectedSatelliteId = satellite.id;

    spyOn(component, 'loadSimulations');

    component.refresh();

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(satellite.id);
  });

  it('doit recharger les satellites sans satellite sélectionné', () => {
    component.selectedMissionId = mission.id;
    component.selectedSatelliteId = null;

    spyOn(component, 'loadSatellites');

    component.refresh();

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(mission.id);
  });

  it('doit réinitialiser les filtres', () => {
    component.searchTerm = 'alpha';
    component.typeFilter = 'ORBIT';
    component.statusFilter = 'SUCCESS';

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.typeFilter).toBe('ALL');
    expect(component.statusFilter).toBe('ALL');
  });

  it('doit ouvrir le panneau de lancement ORBIT', () => {
    prepareLaunchContext();

    component.openLaunchPanel('ORBIT');

    expect(component.launchPanelOpen).toBeTrue();
    expect(component.selectedLaunchType).toBe('ORBIT');
    expect(component.targetAltitudeKm).toBeNull();
  });

  it('ne doit pas ouvrir le panneau sans autorisation', () => {
    component.launchPanelOpen = false;

    component.openLaunchPanel('ORBIT');

    expect(component.launchPanelOpen).toBeFalse();
  });

  it('ne doit pas fermer le panneau pendant un lancement', () => {
    component.launchPanelOpen = true;
    component.launchingOrbit = true;

    component.closeLaunchPanel();

    expect(component.launchPanelOpen).toBeTrue();
  });

  it('doit fermer le panneau hors lancement', () => {
    component.launchPanelOpen = true;
    component.targetAltitudeKm = 800;

    component.closeLaunchPanel();

    expect(component.launchPanelOpen).toBeFalse();
    expect(component.targetAltitudeKm).toBeNull();
  });

  it('doit lancer une simulation orbitale', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'ORBIT';
    component.launchPanelOpen = true;

    simulationService
      .launchOrbitSimulation
      .and.returnValue(of(orbitResponse));

    spyOn(component, 'loadSimulations');

    component.launchSimulation();

    expect(simulationService.launchOrbitSimulation)
      .toHaveBeenCalledOnceWith(satellite.id);

    expect(component.launchingOrbit).toBeFalse();
    expect(component.launchPanelOpen).toBeFalse();
    expect(component.successMessage)
      .toContain('Simulation orbitale');

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(satellite.id);
  });

  it('doit refuser un transfert sans altitude cible', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'HOHMANN';
    component.targetAltitudeKm = null;

    component.launchSimulation();

    expect(component.errorMessage)
      .toContain('altitude cible');

    expect(simulationService.launchHohmannTransfer)
      .not.toHaveBeenCalled();
  });

  it('doit refuser une altitude cible négative', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'HOHMANN';
    component.targetAltitudeKm = -10;

    component.launchSimulation();

    expect(component.errorMessage)
      .toContain('altitude cible');
  });

  it('doit refuser une altitude identique à l’altitude actuelle', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'HOHMANN';
    component.targetAltitudeKm = satellite.altitudeKm ?? null;

    component.launchSimulation();

    expect(component.errorMessage)
      .toContain('diff');
  });

  it('doit lancer un transfert de Hohmann valide', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'HOHMANN';
    component.targetAltitudeKm = 800;

    simulationService
      .launchHohmannTransfer
      .and.returnValue(of(hohmannResponse));

    spyOn(component, 'loadSimulations');

    component.launchSimulation();

    expect(simulationService.launchHohmannTransfer)
      .toHaveBeenCalledOnceWith(
        satellite.id,
        800
      );

    expect(component.launchingHohmann).toBeFalse();
    expect(component.successMessage)
      .toContain('Hohmann');

    expect(component.loadSimulations)
      .toHaveBeenCalledOnceWith(satellite.id);
  });

  it('doit rediriger après une erreur 403 de lancement', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'ORBIT';

    simulationService
      .launchOrbitSimulation
      .and.returnValue(
        throwError(() => ({
          status: 403
        }))
      );

    component.launchSimulation();

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);

    expect(component.launchingOrbit).toBeFalse();
  });

  it('doit gérer une erreur 404 de lancement', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'ORBIT';

    simulationService
      .launchOrbitSimulation
      .and.returnValue(
        throwError(() => ({
          status: 404
        }))
      );

    component.launchSimulation();

    expect(component.errorMessage)
      .toBe('Satellite introuvable.');
  });

  it('doit conserver le message serveur pour une erreur 400', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'HOHMANN';
    component.targetAltitudeKm = 800;

    simulationService
      .launchHohmannTransfer
      .and.returnValue(
        throwError(() => ({
          status: 400,
          error: 'Paramètres orbitaux invalides'
        }))
      );

    component.launchSimulation();

    expect(component.errorMessage)
      .toBe('Paramètres orbitaux invalides');
  });

  it('doit utiliser un message générique pour une erreur 409 non textuelle', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'ORBIT';

    simulationService
      .launchOrbitSimulation
      .and.returnValue(
        throwError(() => ({
          status: 409,
          error: {
            message: 'Conflict'
          }
        }))
      );

    component.launchSimulation();

    expect(component.errorMessage)
      .toContain('Simulation refus');
  });

  it('doit utiliser le message générique pour une erreur 500', () => {
    prepareLaunchContext();

    component.selectedLaunchType = 'ORBIT';

    simulationService
      .launchOrbitSimulation
      .and.returnValue(
        throwError(() => ({
          status: 500
        }))
      );

    component.launchSimulation();

    expect(component.errorMessage)
      .toBe('Impossible de lancer la simulation.');
  });

  it('doit retourner les libellés des types', () => {
    expect(component.getTypeLabel('ORBIT'))
      .toBe('Simulation orbitale');

    expect(component.getTypeLabel('HOHMANN'))
      .toBe('Transfert de Hohmann');
  });

  it('doit retourner les libellés des statuts', () => {
    expect(component.getStatusLabel('SUCCESS'))
      .toContain('ussie');

    expect(component.getStatusLabel('FAILED'))
      .toContain('chou');
  });

  it('doit résumer une simulation orbitale', () => {
    const summary = component.getSimulationSummary(
      orbitSimulation
    );

    expect(summary).toContain('94');
    expect(summary).toContain('7');
  });

  it('doit résumer un transfert de Hohmann', () => {
    const summary = component.getSimulationSummary(
      hohmannSimulation
    );

    expect(summary).toContain('195');
    expect(summary).toContain('45');
  });

  it('doit gérer les valeurs absentes dans un résumé', () => {
    const orbitWithoutResults: SimulationListItemResponse = {
      ...orbitSimulation,
      orbitalPeriodMinutes: null,
      averageVelocityKmS: null
    };

    const hohmannWithoutResults: SimulationListItemResponse = {
      ...hohmannSimulation,
      deltaVTotalMS: null,
      transferTimeMinutes: null
    };

    expect(
      component.getSimulationSummary(orbitWithoutResults)
    ).toContain('Non disponible');

    expect(
      component.getSimulationSummary(hohmannWithoutResults)
    ).toContain('Non disponible');
  });

  it('doit formater une date valide', () => {
    expect(
      component.formatDate('2026-07-14T10:00:00Z')
    ).not.toBe('2026-07-14T10:00:00Z');
  });

  it('doit retourner une date invalide sans modification', () => {
    expect(component.formatDate('date-invalide'))
      .toBe('date-invalide');
  });

  it('doit retourner les identifiants trackBy', () => {
    expect(
      component.trackByMissionId(0, mission)
    ).toBe(mission.id);

    expect(
      component.trackBySatelliteId(0, satellite)
    ).toBe(satellite.id);

    expect(
      component.trackBySimulationId(
        0,
        orbitSimulation
      )
    ).toBe(orbitSimulation.id);
  });

  function prepareLaunchContext(): void {
    authService.isAdmin.and.returnValue(true);
    authService.isOperateur.and.returnValue(false);

    component.missions = [mission];
    component.satellites = [satellite];

    component.selectedMissionId = mission.id;
    component.selectedSatelliteId = satellite.id;
  }
});
