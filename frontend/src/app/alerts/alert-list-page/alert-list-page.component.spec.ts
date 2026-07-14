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
import { Alert } from '../models/alert.model';
import { AlertService } from '../services/alert.service';
import { AlertListPageComponent } from './alert-list-page.component';

describe('AlertListPageComponent', () => {
  let component: AlertListPageComponent;
  let fixture: ComponentFixture<AlertListPageComponent>;

  let missionService: jasmine.SpyObj<MissionService>;
  let alertService: jasmine.SpyObj<AlertService>;
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

  const activeAlert: Alert = {
    id: 10,
    missionId: 2,
    missionName: 'Mission Alpha',
    satelliteId: 5,
    satelliteName: 'Alpha Sat',
    metric: 'temperature',
    type: 'THRESHOLD',
    severity: 'ELEVEE',
    status: 'ACTIVE',
    message: 'Température trop élevée',
    createdAt: '2026-07-14T12:00:00Z',
    ackAt: null,
    ackBy: null
  };

  const acknowledgedAlert: Alert = {
    id: 11,
    missionId: 2,
    missionName: 'Mission Alpha',
    satelliteId: null,
    satelliteName: null,
    metric: 'battery',
    type: 'VARIATION',
    severity: 'MOYENNE',
    status: 'ACQUITTEE',
    message: 'Variation de batterie',
    createdAt: '2026-07-14T11:00:00Z',
    ackAt: '2026-07-14T11:30:00Z',
    ackBy: 'admin@finalspace.fr'
  };

  beforeEach(async () => {
    missionService = jasmine.createSpyObj<MissionService>(
      'MissionService',
      ['findAll']
    );

    alertService = jasmine.createSpyObj<AlertService>(
      'AlertService',
      [
        'findByMission',
        'acknowledge'
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
    alertService.findByMission.and.returnValue(of([]));

    authService.isAdmin.and.returnValue(false);
    authService.isOperateur.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [AlertListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        {
          provide: MissionService,
          useValue: missionService
        },
        {
          provide: AlertService,
          useValue: alertService
        },
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      AlertListPageComponent
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

  it('doit filtrer par message', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.searchTerm = 'température';

    expect(component.filteredAlerts)
      .toEqual([activeAlert]);
  });

  it('doit filtrer par métrique', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.searchTerm = 'battery';

    expect(component.filteredAlerts)
      .toEqual([acknowledgedAlert]);
  });

  it('doit filtrer par type', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.searchTerm = 'variation';

    expect(component.filteredAlerts)
      .toEqual([acknowledgedAlert]);
  });

  it('doit filtrer par satellite', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.searchTerm = 'alpha sat';

    expect(component.filteredAlerts)
      .toEqual([activeAlert]);
  });

  it('doit filtrer par statut', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.statusFilter = 'ACTIVE';

    expect(component.filteredAlerts)
      .toEqual([activeAlert]);
  });

  it('doit filtrer par gravité', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.severityFilter = 'MOYENNE';

    expect(component.filteredAlerts)
      .toEqual([acknowledgedAlert]);
  });

  it('doit combiner les filtres', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.searchTerm = 'temp';
    component.statusFilter = 'ACTIVE';
    component.severityFilter = 'ELEVEE';

    expect(component.filteredAlerts)
      .toEqual([activeAlert]);
  });

  it('doit calculer les compteurs', () => {
    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    expect(component.activeAlertCount).toBe(1);
    expect(component.acknowledgedAlertCount).toBe(1);
    expect(component.highSeverityAlertCount).toBe(1);
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
    expect(component.canManage).toBeFalse();
  });

  it('doit charger et trier les missions', () => {
    missionService.findAll.and.returnValue(
      of([
        closedMission,
        activeMission
      ])
    );

    spyOn(component, 'loadAlerts');

    component.loadMissions();

    expect(component.missionsLoading).toBeFalse();

    expect(component.missions.map(mission => mission.name))
      .toEqual([
        'Mission Alpha',
        'Mission Clôturée'
      ]);

    expect(component.selectedMissionId)
      .toBe(activeMission.id);

    expect(component.loadAlerts)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit gérer une liste de missions vide', () => {
    missionService.findAll.and.returnValue(of([]));

    component.loadMissions();

    expect(component.selectedMissionId).toBeNull();
  });

  it('doit rediriger lors d’une erreur 403 des missions', () => {
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

  it('doit charger et trier les alertes par date décroissante', () => {
    alertService.findByMission.and.returnValue(
      of([
        acknowledgedAlert,
        activeAlert
      ])
    );

    component.loadAlerts(activeMission.id);

    expect(component.alertsLoading).toBeFalse();

    expect(component.alerts.map(alert => alert.id))
      .toEqual([
        activeAlert.id,
        acknowledgedAlert.id
      ]);

    expect(alertService.findByMission)
      .toHaveBeenCalledWith(
        activeMission.id,
        'ALL'
      );
  });

  it('doit rediriger sur une erreur 403 des alertes', () => {
    alertService.findByMission.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.loadAlerts(activeMission.id);

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
  });

  it('doit afficher Mission introuvable sur une erreur 404', () => {
    alertService.findByMission.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.loadAlerts(activeMission.id);

    expect(component.errorMessage)
      .toBe('Mission introuvable.');
  });

  it('doit afficher une erreur générique des alertes', () => {
    alertService.findByMission.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadAlerts(activeMission.id);

    expect(component.errorMessage)
      .toBe('Impossible de charger les alertes.');
  });

  it('doit recharger les alertes avec une mission sélectionnée', () => {
    component.selectedMissionId = activeMission.id;

    spyOn(component, 'loadAlerts');

    component.refresh();

    expect(component.loadAlerts)
      .toHaveBeenCalledOnceWith(activeMission.id);
  });

  it('doit recharger les missions sans mission sélectionnée', () => {
    component.selectedMissionId = null;

    spyOn(component, 'loadMissions');

    component.refresh();

    expect(component.loadMissions).toHaveBeenCalled();
  });

  it('doit réinitialiser les filtres', () => {
    component.searchTerm = 'test';
    component.statusFilter = 'ACTIVE';
    component.severityFilter = 'ELEVEE';

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('ALL');
    expect(component.severityFilter).toBe('ALL');
  });

  it('doit autoriser l’acquittement d’une alerte active', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canAcknowledge(activeAlert))
      .toBeTrue();
  });

  it('doit refuser l’acquittement d’une alerte déjà acquittée', () => {
    authService.isAdmin.and.returnValue(true);

    expect(component.canAcknowledge(acknowledgedAlert))
      .toBeFalse();
  });

  it('doit refuser l’acquittement à un lecteur', () => {
    expect(component.canAcknowledge(activeAlert))
      .toBeFalse();
  });

  it('ne doit rien faire si l’acquittement est interdit', () => {
    component.acknowledgeAlert(activeAlert);

    expect(alertService.acknowledge)
      .not.toHaveBeenCalled();
  });

  it('ne doit rien faire si la confirmation est refusée', () => {
    authService.isAdmin.and.returnValue(true);

    spyOn(window, 'confirm').and.returnValue(false);

    component.acknowledgeAlert(activeAlert);

    expect(alertService.acknowledge)
      .not.toHaveBeenCalled();
  });

  it('doit acquitter une alerte', () => {
    authService.isAdmin.and.returnValue(true);

    spyOn(window, 'confirm').and.returnValue(true);

    const updatedAlert: Alert = {
      ...activeAlert,
      status: 'ACQUITTEE',
      ackAt: '2026-07-14T13:00:00Z',
      ackBy: 'admin@finalspace.fr'
    };

    alertService.acknowledge.and.returnValue(
      of(updatedAlert)
    );

    component.alerts = [
      activeAlert,
      acknowledgedAlert
    ];

    component.acknowledgeAlert(activeAlert);

    expect(alertService.acknowledge)
      .toHaveBeenCalledOnceWith(activeAlert.id);

    expect(component.alerts[0])
      .toEqual(updatedAlert);

    expect(component.acknowledgingAlertId)
      .toBeNull();

    expect(component.successMessage)
      .toContain(`${updatedAlert.id}`);
  });

  it('doit rediriger sur une erreur 403 d’acquittement', () => {
    authService.isAdmin.and.returnValue(true);
    spyOn(window, 'confirm').and.returnValue(true);

    alertService.acknowledge.and.returnValue(
      throwError(() => ({
        status: 403
      }))
    );

    component.acknowledgeAlert(activeAlert);

    expect(router.navigate)
      .toHaveBeenCalledWith(['/forbidden']);
  });

  it('doit afficher Alerte introuvable sur une erreur 404', () => {
    authService.isAdmin.and.returnValue(true);
    spyOn(window, 'confirm').and.returnValue(true);

    alertService.acknowledge.and.returnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.acknowledgeAlert(activeAlert);

    expect(component.errorMessage)
      .toBe('Alerte introuvable.');
  });

  it('doit gérer une erreur 400 d’acquittement', () => {
    authService.isAdmin.and.returnValue(true);
    spyOn(window, 'confirm').and.returnValue(true);

    alertService.acknowledge.and.returnValue(
      throwError(() => ({
        status: 400
      }))
    );

    component.acknowledgeAlert(activeAlert);

    expect(component.errorMessage)
      .toContain('acquitt');
  });

  it('doit gérer une erreur 409 d’acquittement', () => {
    authService.isAdmin.and.returnValue(true);
    spyOn(window, 'confirm').and.returnValue(true);

    alertService.acknowledge.and.returnValue(
      throwError(() => ({
        status: 409
      }))
    );

    component.acknowledgeAlert(activeAlert);

    expect(component.errorMessage)
      .toContain('acquitt');
  });

  it('doit afficher une erreur générique d’acquittement', () => {
    authService.isAdmin.and.returnValue(true);
    spyOn(window, 'confirm').and.returnValue(true);

    alertService.acknowledge.and.returnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.acknowledgeAlert(activeAlert);

    expect(component.errorMessage)
      .toContain('Impossible');
  });

  it('doit retourner les libellés de gravité', () => {
    expect(component.getSeverityLabel('FAIBLE'))
      .toBe('Faible');

    expect(component.getSeverityLabel('MOYENNE'))
      .toBe('Moyenne');

    expect(component.getSeverityLabel('ELEVEE'))
      .toContain('lev');
  });

  it('doit retourner les libellés de statut', () => {
    expect(component.getStatusLabel('ACTIVE'))
      .toBe('Active');

    expect(component.getStatusLabel('ACQUITTEE'))
      .toContain('Acquitt');
  });

  it('doit formater une date valide', () => {
    expect(
      component.formatDate('2026-07-14T10:00:00Z')
    ).not.toBe('2026-07-14T10:00:00Z');
  });

  it('doit retourner une date invalide telle quelle', () => {
    expect(component.formatDate('invalide'))
      .toBe('invalide');
  });

  it('doit gérer une date absente', () => {
    expect(component.formatDate(null))
      .toContain('Non renseign');
  });

  it('doit retourner les identifiants trackBy', () => {
    expect(
      component.trackByMissionId(0, activeMission)
    ).toBe(activeMission.id);

    expect(
      component.trackByAlertId(0, activeAlert)
    ).toBe(activeAlert.id);
  });
});
