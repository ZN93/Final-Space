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
import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { Satellite } from '../models/satellite.model';
import { SatelliteService } from '../services/satellite.service';
import { SatelliteListPageComponent } from './satellite-list-page.component';

describe('SatelliteListPageComponent', () => {
  let component: SatelliteListPageComponent;
  let fixture: ComponentFixture<SatelliteListPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let satelliteService: jasmine.SpyObj<SatelliteService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const activeMission: Mission = {
    id: 2,
    name: 'Mission Alpha',
    description: 'Mission active',
    status: 'ACTIVE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: null
  };

  const closedMission: Mission = {
    id: 1,
    name: 'Mission Clôturée',
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
    missionId: 2,
    missionName: 'Mission Alpha'
  };

  const inactiveSatellite: Satellite = {
    id: 11,
    name: 'Beta Sat',
    status: 'INACTIF',
    massKg: 900,
    altitudeKm: 600,
    inclinationDeg: 45,
    eccentricity: 0.02,
    createdAt: '2026-07-14T11:00:00Z',
    updatedAt: '2026-07-14T11:00:00Z',
    missionId: 2,
    missionName: 'Mission Alpha'
  };

  beforeEach(async () => {
    missionService = jasmine.createSpyObj<MissionService>(
      'MissionService',
      ['findAll']
    );

    satelliteService = jasmine.createSpyObj<SatelliteService>(
      'SatelliteService',
      [
        'findByMission',
        'create'
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

    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [SatelliteListPageComponent],
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
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      SatelliteListPageComponent
    );

    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit retourner la mission sélectionnée', () => {
    component.missions = [
      closedMission,
      activeMission
    ];

    component.selectedMissionId = activeMission.id;

    expect(component.selectedMission)
      .toEqual(activeMission);
  });

  it('doit retourner null sans mission correspondante', () => {
    component.missions = [activeMission];
    component.selectedMissionId = 999;

    expect(component.selectedMission).toBeNull();
  });

  it('doit filtrer les satellites par texte', () => {
    component.satellites = [
      activeSatellite,
      inactiveSatellite
    ];

    component.searchTerm = 'alpha';

    expect(component.filteredSatellites)
      .toEqual([activeSatellite]);
  });

  it('doit filtrer les satellites par statut', () => {
    component.satellites = [
      activeSatellite,
      inactiveSatellite
    ];

    component.statusFilter = 'INACTIF';

    expect(component.filteredSatellites)
      .toEqual([inactiveSatellite]);
  });

  it('doit combiner le filtre texte et le statut', () => {
    component.satellites = [
      activeSatellite,
      inactiveSatellite
    ];

    component.searchTerm = 'beta';
    component.statusFilter = 'INACTIF';

    expect(component.filteredSatellites)
      .toEqual([inactiveSatellite]);
  });

  it('doit compter les satellites actifs et inactifs', () => {
    component.satellites = [
      activeSatellite,
      inactiveSatellite
    ];

    expect(component.activeSatelliteCount).toBe(1);
    expect(component.inactiveSatelliteCount).toBe(1);
  });

  it('doit autoriser la gestion à un administrateur', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser la gestion à un opérateur', () => {
    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit refuser la gestion à un lecteur', () => {
    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    expect(component.canManage).toBeFalse();
  });

  it('doit autoriser la création sur une mission active', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [activeMission];
    component.selectedMissionId = activeMission.id;

    expect(component.canCreateSatellite).toBeTrue();
  });

  it('doit refuser la création sur une mission clôturée', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [closedMission];
    component.selectedMissionId = closedMission.id;

    expect(component.canCreateSatellite).toBeFalse();
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
        'Mission Clôturée'
      ]);

    expect(component.selectedMissionId)
      .toBe(activeMission.id);

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit gérer une liste de missions vide', () => {
    missionService.findAll.and.returnValue(of([]));

    component.satellites = [activeSatellite];

    component.loadMissions();

    expect(component.selectedMissionId).toBeNull();
    expect(component.satellites).toEqual([]);
  });

  it('doit rediriger vers forbidden lors du chargement des missions', () => {
    missionService.findAll.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.loadMissions();

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);

    expect(component.missionsLoading).toBeFalse();
  });

  it('doit afficher une erreur générique de chargement des missions', () => {
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

    component.loadSatellites(activeMission.id);

    expect(component.satellitesLoading).toBeFalse();

    expect(component.satellites.map(satellite => satellite.name))
      .toEqual([
        'Alpha Sat',
        'Beta Sat'
      ]);
  });

  it('doit afficher Mission introuvable sur une erreur 404', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(component.errorMessage)
      .toBe('Mission introuvable.');
  });

  it('doit rediriger sur une erreur 403 des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
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

  it('doit recharger les missions sans mission sélectionnée', () => {
    component.selectedMissionId = null;

    spyOn(component, 'loadMissions');

    component.refresh();

    expect(component.loadMissions).toHaveBeenCalled();
  });

  it('doit recharger les satellites avec une mission sélectionnée', () => {
    component.selectedMissionId = activeMission.id;

    spyOn(component, 'loadSatellites');

    component.refresh();

    expect(component.loadSatellites)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit réinitialiser les filtres', () => {
    component.searchTerm = 'sat';
    component.statusFilter = 'ACTIF';

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('ALL');
  });

  it('doit ouvrir le formulaire de création', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [activeMission];
    component.selectedMissionId = activeMission.id;
    component.newSatelliteName = 'Ancienne valeur';

    component.openCreationPanel();

    expect(component.creationPanelOpen).toBeTrue();
    expect(component.newSatelliteName).toBe('');
  });

  it('ne doit pas ouvrir le formulaire sans autorisation', () => {
    component.creationPanelOpen = false;

    component.openCreationPanel();

    expect(component.creationPanelOpen).toBeFalse();
  });

  it('ne doit pas fermer le formulaire pendant la création', () => {
    component.creationPanelOpen = true;
    component.creating = true;

    component.closeCreationPanel();

    expect(component.creationPanelOpen).toBeTrue();
  });

  it('doit fermer et réinitialiser le formulaire', () => {
    component.creationPanelOpen = true;
    component.creating = false;
    component.newSatelliteName = 'Test';
    component.newSatelliteMassKg = 100;

    component.closeCreationPanel();

    expect(component.creationPanelOpen).toBeFalse();
    expect(component.newSatelliteName).toBe('');
    expect(component.newSatelliteMassKg).toBeNull();
  });

  it('doit refuser un nom vide', () => {
    prepareValidCreation();

    component.newSatelliteName = '   ';

    component.createSatellite();

    expect(component.errorMessage)
      .toBe('Le nom du satellite est obligatoire.');

    expect(satelliteService.create)
      .not.toHaveBeenCalled();
  });

  it('doit refuser une masse nulle', () => {
    prepareValidCreation();

    component.newSatelliteMassKg = null;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('masse');

    expect(satelliteService.create)
      .not.toHaveBeenCalled();
  });

  it('doit refuser une masse négative', () => {
    prepareValidCreation();

    component.newSatelliteMassKg = -1;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('masse');
  });

  it('doit refuser une altitude invalide', () => {
    prepareValidCreation();

    component.newSatelliteAltitudeKm = 0;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('altitude');
  });

  it('doit refuser une inclinaison négative', () => {
    prepareValidCreation();

    component.newSatelliteInclinationDeg = -1;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('inclinaison');
  });

  it('doit refuser une inclinaison supérieure à 180', () => {
    prepareValidCreation();

    component.newSatelliteInclinationDeg = 181;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('inclinaison');
  });

  it('doit refuser une excentricité négative', () => {
    prepareValidCreation();

    component.newSatelliteEccentricity = -0.1;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('excentricit');
  });

  it('doit refuser une excentricité égale à 1', () => {
    prepareValidCreation();

    component.newSatelliteEccentricity = 1;

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('excentricit');
  });

  it('doit créer un satellite valide', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      of(activeSatellite)
    );

    component.satellites = [inactiveSatellite];
    component.creationPanelOpen = true;

    component.createSatellite();

    expect(satelliteService.create)
      .toHaveBeenCalledOnceWith(
        activeMission.id,
        {
          name: 'Nouveau satellite',
          massKg: 850,
          altitudeKm: 500,
          inclinationDeg: 51.6,
          eccentricity: 0.01
        }
      );

    expect(component.creating).toBeFalse();
    expect(component.creationPanelOpen).toBeFalse();

    expect(component.satellites.map(satellite => satellite.name))
      .toEqual([
        'Alpha Sat',
        'Beta Sat'
      ]);

    expect(component.successMessage)
      .toContain(activeSatellite.name);
  });

  it('doit gérer une erreur 400 avec message serveur', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      throwError(() => ({
        status: 400,
        error: 'Nom déjà utilisé'
      }))
    );

    component.createSatellite();

    expect(component.errorMessage)
      .toBe('Nom déjà utilisé');

    expect(component.creating).toBeFalse();
  });

  it('doit gérer une erreur 409 sans message texte', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      throwError(() => ({
        status: 409,
        error: {
          message: 'Conflict'
        }
      }))
    );

    component.createSatellite();

    expect(component.errorMessage)
      .toContain('Cr');
  });

  it('doit gérer une mission inexistante à la création', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.createSatellite();

    expect(component.errorMessage)
      .toBe('Mission introuvable.');
  });

  it('doit rediriger sur une erreur 403 à la création', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.createSatellite();

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
  });

  it('doit afficher une erreur générique à la création', () => {
    prepareValidCreation();

    satelliteService.create.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.createSatellite();

    expect(component.errorMessage)
      .toBe('Impossible de créer le satellite.');
  });

  it('doit formater un nombre avec son unité', () => {
    expect(component.formatNumber(500, 'km'))
      .toContain('500');

    expect(component.formatNumber(500, 'km'))
      .toContain('km');
  });

  it('doit gérer une valeur numérique absente', () => {
    expect(component.formatNumber(null, 'km'))
      .toContain('Non renseign');

    expect(component.formatNumber(undefined, 'kg'))
      .toContain('Non renseign');
  });

  it('doit retourner les identifiants pour trackBy', () => {
    expect(
      component.trackByMissionId(0, activeMission)
    ).toBe(activeMission.id);

    expect(
      component.trackBySatelliteId(0, activeSatellite)
    ).toBe(activeSatellite.id);
  });

  function prepareValidCreation(): void {
    authService.isAdmin.and.returnValue(true);
    authService.isOperateur.and.returnValue(false);

    component.missions = [activeMission];
    component.selectedMissionId = activeMission.id;

    component.newSatelliteName = 'Nouveau satellite';
    component.newSatelliteMassKg = 850;
    component.newSatelliteAltitudeKm = 500;
    component.newSatelliteInclinationDeg = 51.6;
    component.newSatelliteEccentricity = 0.01;
  }
});
