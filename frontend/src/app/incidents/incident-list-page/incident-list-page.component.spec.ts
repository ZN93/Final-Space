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
import { Incident } from '../models/incident.model';
import { IncidentService } from '../services/incident.service';
import { IncidentListPageComponent } from './incident-list-page.component';

describe('IncidentListPageComponent', () => {
  let component: IncidentListPageComponent;
  let fixture: ComponentFixture<IncidentListPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let satelliteService: jasmine.SpyObj<SatelliteService>;
  let incidentService: jasmine.SpyObj<IncidentService>;
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
    ...activeMission,
    id: 3,
    name: 'Mission Clôturée',
    status: 'CLOTUREE',
    closedAt: '2026-07-14T12:00:00Z'
  };

  const satellite: Satellite = {
    id: 5,
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

  const openIncident: Incident = {
    id: 20,
    missionId: 2,
    missionName: 'Mission Alpha',
    satelliteId: 5,
    satelliteName: 'Alpha Sat',
    alertId: null,
    title: 'Perte de signal',
    description: 'Signal interrompu',
    notes: 'Diagnostic initial',
    severity: 'ELEVEE',
    status: 'OUVERT',
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:00:00Z',
    closedAt: null,
    createdBy: 'admin@finalspace.fr'
  };

  const inProgressIncident: Incident = {
    ...openIncident,
    id: 21,
    title: 'Batterie faible',
    description: 'Niveau faible',
    notes: 'Analyse en cours',
    severity: 'MOYENNE',
    status: 'EN_COURS',
    createdAt: '2026-07-14T11:00:00Z',
    createdBy: 'operator@finalspace.fr'
  };

  const closedIncident: Incident = {
    ...openIncident,
    id: 22,
    title: 'Incident clôturé',
    severity: 'FAIBLE',
    status: 'CLOTURE',
    createdAt: '2026-07-14T10:00:00Z',
    closedAt: '2026-07-14T13:00:00Z'
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

    incidentService = jasmine.createSpyObj<IncidentService>(
      'IncidentService',
      [
        'findByMission',
        'create',
        'update',
        'updateStatus',
        'close'
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
    incidentService.findByMission.and.returnValue(of([]));

    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [IncidentListPageComponent],
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
          provide: IncidentService,
          useValue: incidentService
        },
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      IncidentListPageComponent
    );

    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'scrollTo');
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

  it('doit filtrer les incidents par titre', () => {
    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.searchTerm = 'signal';

    expect(component.filteredIncidents)
      .toEqual([openIncident]);
  });

  it('doit filtrer par description', () => {
    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.searchTerm = 'niveau faible';

    expect(component.filteredIncidents)
      .toEqual([inProgressIncident]);
  });

  it('doit filtrer par notes', () => {
    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.searchTerm = 'analyse en cours';

    expect(component.filteredIncidents)
      .toEqual([inProgressIncident]);
  });

  it('doit filtrer par satellite', () => {
    component.incidents = [openIncident];

    component.searchTerm = 'alpha sat';

    expect(component.filteredIncidents)
      .toEqual([openIncident]);
  });

  it('doit filtrer par auteur', () => {
    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.searchTerm = 'operator';

    expect(component.filteredIncidents)
      .toEqual([inProgressIncident]);
  });

  it('doit filtrer par statut et gravité', () => {
    component.incidents = [
      openIncident,
      inProgressIncident,
      closedIncident
    ];

    component.statusFilter = 'EN_COURS';
    component.severityFilter = 'MOYENNE';

    expect(component.filteredIncidents)
      .toEqual([inProgressIncident]);
  });

  it('doit calculer les compteurs', () => {
    component.incidents = [
      openIncident,
      inProgressIncident,
      closedIncident
    ];

    expect(component.openIncidentCount).toBe(1);
    expect(component.inProgressIncidentCount).toBe(1);
    expect(component.closedIncidentCount).toBe(1);
    expect(component.highSeverityIncidentCount).toBe(1);
  });

  it('doit autoriser la gestion à un administrateur', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canManage).toBeTrue();
  });

  it('doit autoriser la création sur une mission active', () => {
    prepareManageContext();

    expect(component.canCreateIncident).toBeTrue();
  });

  it('doit refuser la création sur une mission clôturée', () => {
    authService.isAdmin.and.returnValue(true);

    component.missions = [closedMission];
    component.selectedMissionId = closedMission.id;

    expect(component.canCreateIncident).toBeFalse();
  });

  it('doit charger les missions et sélectionner la mission active', () => {
    missionService.findAll.and.returnValue(
      of([
        closedMission,
        activeMission
      ])
    );

    spyOn(component, 'loadIncidents');
    spyOn(component, 'loadSatellites');

    component.loadMissions();

    expect(component.selectedMissionId)
      .toBe(activeMission.id);

    expect(component.loadIncidents)
      .toHaveBeenCalledOnceWith(activeMission.id);

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

  it('doit charger et trier les incidents', () => {
    incidentService.findByMission.and.returnValue(
      of([
        closedIncident,
        openIncident,
        inProgressIncident
      ])
    );

    component.loadIncidents(activeMission.id);

    expect(component.incidents.map(incident => incident.id))
      .toEqual([
        openIncident.id,
        inProgressIncident.id,
        closedIncident.id
      ]);
  });

  it('doit charger et trier les satellites', () => {
    const secondSatellite: Satellite = {
      ...satellite,
      id: 6,
      name: 'Beta Sat'
    };

    satelliteService.findByMission.and.returnValue(
      of([
        secondSatellite,
        satellite
      ])
    );

    component.loadSatellites(activeMission.id);

    expect(component.satellites.map(item => item.name))
      .toEqual([
        'Alpha Sat',
        'Beta Sat'
      ]);
  });

  it('doit gérer une erreur 404 des incidents', () => {
    incidentService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadIncidents(activeMission.id);

    expect(component.errorMessage)
      .toContain('introuvable');
  });

  it('doit gérer une erreur générique des satellites', () => {
    satelliteService.findByMission.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadSatellites(activeMission.id);

    expect(component.errorMessage)
      .toBe('Impossible de charger les satellites.');
  });

  it('doit réinitialiser les filtres', () => {
    component.searchTerm = 'test';
    component.statusFilter = 'OUVERT';
    component.severityFilter = 'ELEVEE';

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('ALL');
    expect(component.severityFilter).toBe('ALL');
  });

  it('doit ouvrir le panneau de création', () => {
    prepareManageContext();

    component.openCreationPanel();

    expect(component.creationPanelOpen).toBeTrue();
    expect(component.editingIncident).toBeNull();
  });

  it('ne doit pas ouvrir le panneau sans permission', () => {
    component.openCreationPanel();

    expect(component.creationPanelOpen).toBeFalse();
  });

  it('ne doit pas fermer le panneau pendant une sauvegarde', () => {
    component.creationPanelOpen = true;
    component.saving = true;

    component.closeCreationPanel();

    expect(component.creationPanelOpen).toBeTrue();
  });

  it('doit refuser une création sans titre', () => {
    prepareManageContext();

    component.createTitle = '   ';

    component.createIncident();

    expect(component.errorMessage)
      .toContain('titre');

    expect(incidentService.create)
      .not.toHaveBeenCalled();
  });

  it('doit créer un incident', () => {
    prepareManageContext();

    component.createTitle = '  Nouvel incident  ';
    component.createDescription = ' Description ';
    component.createNotes = ' Notes ';
    component.createSeverity = 'ELEVEE';
    component.createSatelliteId = satellite.id;
    component.creationPanelOpen = true;

    const createdIncident: Incident = {
      ...openIncident,
      id: 30,
      title: 'Nouvel incident'
    };

    incidentService.create.and.returnValue(
      of(createdIncident)
    );

    component.createIncident();

    expect(incidentService.create)
      .toHaveBeenCalledOnceWith(
        activeMission.id,
        {
          satelliteId: satellite.id,
          alertId: null,
          title: 'Nouvel incident',
          description: 'Description',
          notes: 'Notes',
          severity: 'ELEVEE'
        }
      );

    expect(component.incidents[0])
      .toEqual(createdIncident);

    expect(component.creationPanelOpen).toBeFalse();
    expect(component.saving).toBeFalse();
  });

  it('doit gérer une erreur 400 avec message serveur à la création', () => {
    prepareManageContext();

    component.createTitle = 'Incident';

    incidentService.create.and.returnValue(
      throwError(() => ({
        status: 400,
        error: 'Création refusée'
      }))
    );

    component.createIncident();

    expect(component.errorMessage)
      .toBe('Création refusée');
  });

  it('doit autoriser la modification d’un incident ouvert', () => {
    prepareManageContext();

    expect(component.canEditIncident(openIncident))
      .toBeTrue();
  });

  it('doit refuser la modification d’un incident clôturé', () => {
    prepareManageContext();

    expect(component.canEditIncident(closedIncident))
      .toBeFalse();
  });

  it('doit autoriser le passage en cours depuis ouvert', () => {
    prepareManageContext();

    expect(component.canMoveToInProgress(openIncident))
      .toBeTrue();

    expect(component.canMoveToInProgress(inProgressIncident))
      .toBeFalse();
  });

  it('doit autoriser la clôture d’un incident non clôturé', () => {
    prepareManageContext();

    expect(component.canCloseIncident(openIncident))
      .toBeTrue();

    expect(component.canCloseIncident(closedIncident))
      .toBeFalse();
  });

  it('doit initialiser le formulaire de modification', () => {
    prepareManageContext();

    component.startEditIncident(openIncident);

    expect(component.editingIncident)
      .toEqual(openIncident);

    expect(component.editTitle)
      .toBe(openIncident.title);

    expect(component.editDescription)
      .toBe(openIncident.description ?? '');

    expect(window.scrollTo)
      .toHaveBeenCalled();
  });

  it('ne doit pas modifier un incident sans permission', () => {
    component.startEditIncident(openIncident);

    expect(component.editingIncident).toBeNull();
  });

  it('doit annuler la modification', () => {
    component.editingIncident = openIncident;
    component.editTitle = 'Test';

    component.cancelEditIncident();

    expect(component.editingIncident).toBeNull();
    expect(component.editTitle).toBe('');
  });

  it('ne doit pas annuler pendant une sauvegarde', () => {
    component.editingIncident = openIncident;
    component.saving = true;

    component.cancelEditIncident();

    expect(component.editingIncident)
      .toEqual(openIncident);
  });

  it('doit refuser une modification sans titre', () => {
    prepareManageContext();

    component.editingIncident = openIncident;
    component.editTitle = '   ';

    component.updateIncident();

    expect(component.errorMessage)
      .toContain('titre');

    expect(incidentService.update)
      .not.toHaveBeenCalled();
  });

  it('doit modifier un incident', () => {
    prepareManageContext();

    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.editingIncident = openIncident;
    component.editTitle = ' Incident modifié ';
    component.editDescription = ' Nouvelle description ';
    component.editNotes = ' Nouvelles notes ';
    component.editSeverity = 'MOYENNE';

    const updatedIncident: Incident = {
      ...openIncident,
      title: 'Incident modifié',
      description: 'Nouvelle description',
      notes: 'Nouvelles notes',
      severity: 'MOYENNE'
    };

    incidentService.update.and.returnValue(
      of(updatedIncident)
    );

    component.updateIncident();

    expect(incidentService.update)
      .toHaveBeenCalledOnceWith(
        openIncident.id,
        {
          title: 'Incident modifié',
          description: 'Nouvelle description',
          notes: 'Nouvelles notes',
          severity: 'MOYENNE'
        }
      );

    expect(component.incidents[0])
      .toEqual(updatedIncident);

    expect(component.editingIncident).toBeNull();
  });

  it('doit passer un incident en cours', () => {
    prepareManageContext();

    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    const updatedIncident: Incident = {
      ...openIncident,
      status: 'EN_COURS'
    };

    incidentService.updateStatus.and.returnValue(
      of(updatedIncident)
    );

    component.moveToInProgress(openIncident);

    expect(incidentService.updateStatus)
      .toHaveBeenCalledOnceWith(
        openIncident.id,
        'EN_COURS'
      );

    expect(component.incidents[0].status)
      .toBe('EN_COURS');

    expect(component.processingIncidentId)
      .toBeNull();
  });

  it('doit gérer une erreur du passage en cours', () => {
    prepareManageContext();

    incidentService.updateStatus.and.returnValue(
      throwError(() => ({
        status: 409,
        error: {
          message: 'Conflict'
        }
      }))
    );

    component.moveToInProgress(openIncident);

    expect(component.errorMessage)
      .toContain('Action refus');
  });

  it('ne doit pas clôturer sans confirmation', () => {
    prepareManageContext();

    spyOn(window, 'confirm').and.returnValue(false);

    component.closeIncident(openIncident);

    expect(incidentService.close)
      .not.toHaveBeenCalled();
  });

  it('doit clôturer un incident', () => {
    prepareManageContext();

    spyOn(window, 'confirm').and.returnValue(true);

    component.incidents = [
      openIncident,
      inProgressIncident
    ];

    component.editingIncident = openIncident;

    const updatedIncident: Incident = {
      ...openIncident,
      status: 'CLOTURE',
      closedAt: '2026-07-14T14:00:00Z'
    };

    incidentService.close.and.returnValue(
      of(updatedIncident)
    );

    component.closeIncident(openIncident);

    expect(incidentService.close)
      .toHaveBeenCalledOnceWith(openIncident.id);

    expect(component.incidents[0].status)
      .toBe('CLOTURE');

    expect(component.editingIncident).toBeNull();
  });

  it('doit gérer une erreur 403 de clôture', () => {
    prepareManageContext();

    spyOn(window, 'confirm').and.returnValue(true);

    incidentService.close.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.closeIncident(openIncident);

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
  });

  it('doit retourner les libellés de statut', () => {
    expect(component.getStatusLabel('OUVERT'))
      .toBe('Ouvert');

    expect(component.getStatusLabel('EN_COURS'))
      .toBe('En cours');

    expect(component.getStatusLabel('CLOTURE'))
      .toContain('Cl');
  });

  it('doit retourner les libellés de gravité', () => {
    expect(component.getSeverityLabel('FAIBLE'))
      .toBe('Faible');

    expect(component.getSeverityLabel('MOYENNE'))
      .toBe('Moyenne');

    expect(component.getSeverityLabel('ELEVEE'))
      .toContain('lev');
  });

  it('doit formater les dates', () => {
    expect(
      component.formatDate('2026-07-14T10:00:00Z')
    ).not.toBe('2026-07-14T10:00:00Z');

    expect(component.formatDate('invalide'))
      .toBe('invalide');

    expect(component.formatDate(null))
      .toContain('Non renseign');
  });

  it('doit retourner les identifiants trackBy', () => {
    expect(
      component.trackByMissionId(0, activeMission)
    ).toBe(activeMission.id);

    expect(
      component.trackBySatelliteId(0, satellite)
    ).toBe(satellite.id);

    expect(
      component.trackByIncidentId(0, openIncident)
    ).toBe(openIncident.id);
  });

  function prepareManageContext(): void {
    authService.isAdmin.and.returnValue(true);
    authService.isOperateur.and.returnValue(false);

    component.missions = [activeMission];
    component.selectedMissionId = activeMission.id;

    component.satellites = [satellite];
  }
});
