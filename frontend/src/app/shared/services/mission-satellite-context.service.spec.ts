import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Params,
  Router,
  convertToParamMap
} from '@angular/router';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';
import { MissionSatelliteContextService } from './mission-satellite-context.service';

describe('MissionSatelliteContextService', () => {
  let service: MissionSatelliteContextService;

  const createMission = (
    id: number,
    name: string,
    status: Mission['status']
  ): Mission => ({
    id,
    name,
    status,
    createdAt: '2026-07-20T00:00:00Z'
  });

  const createSatellite = (
    id: number,
    name: string,
    status: Satellite['status']
  ): Satellite => ({
    id,
    name,
    status
  } as Satellite);

  const createRoute = (queryParams: Params): ActivatedRoute => ({
    snapshot: {
      queryParamMap: convertToParamMap(queryParams)
    }
  } as unknown as ActivatedRoute);

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(
      MissionSatelliteContextService
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should read a positive integer selection from query parameters', () => {
    const route = createRoute({ missionId: '42' });

    expect(service.readRequestedId(route, 'missionId'))
      .toBe(42);
  });

  it('should ignore an absent or empty selection query parameter', () => {
    expect(
      service.readRequestedId(createRoute({}), 'missionId')
    ).toBeNull();

    expect(
      service.readRequestedId(
        createRoute({ satelliteId: '  ' }),
        'satelliteId'
      )
    ).toBeNull();
  });

  it('should ignore invalid selection identifiers', () => {
    expect(
      service.readRequestedId(
        createRoute({ missionId: 'invalid' }),
        'missionId'
      )
    ).toBeNull();

    expect(
      service.readRequestedId(
        createRoute({ missionId: '1.5' }),
        'missionId'
      )
    ).toBeNull();

    expect(
      service.readRequestedId(
        createRoute({ missionId: '0' }),
        'missionId'
      )
    ).toBeNull();
  });

  it('should update mission and satellite query parameters', () => {
    const router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate']
    );
    const route = createRoute({ existing: 'value' });

    service.updateQueryParams(
      router,
      route,
      4,
      8
    );

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: {
        missionId: 4,
        satelliteId: 8
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  });

  it('should sort missions by name without modifying the source array', () => {
    const missions = [
      createMission(2, 'Zulu', 'CLOTUREE'),
      createMission(1, 'Alpha', 'ACTIVE')
    ];

    const result = service.sortMissions(missions);

    expect(result.map(mission => mission.name))
      .toEqual(['Alpha', 'Zulu']);

    expect(missions.map(mission => mission.name))
      .toEqual(['Zulu', 'Alpha']);
  });

  it('should select the requested mission', () => {
    const missions = [
      createMission(1, 'Mission A', 'ACTIVE'),
      createMission(2, 'Mission B', 'CLOTUREE')
    ];

    expect(service.selectMission(missions, 2)?.id)
      .toBe(2);
  });

  it('should select an active mission when the requested mission is absent', () => {
    const missions = [
      createMission(1, 'Mission A', 'CLOTUREE'),
      createMission(2, 'Mission B', 'ACTIVE')
    ];

    expect(service.selectMission(missions, 99)?.id)
      .toBe(2);
  });

  it('should select the first mission when none is active', () => {
    const missions = [
      createMission(1, 'Mission A', 'CLOTUREE'),
      createMission(2, 'Mission B', 'CLOTUREE')
    ];

    expect(service.selectMission(missions, null)?.id)
      .toBe(1);
  });

  it('should return null when the mission list is empty', () => {
    expect(service.selectMission([], null))
      .toBeNull();
  });

  it('should sort satellites by name without modifying the source array', () => {
    const satellites = [
      createSatellite(2, 'Zulu Sat', 'INACTIF'),
      createSatellite(1, 'Alpha Sat', 'ACTIF')
    ];

    const result = service.sortSatellites(satellites);

    expect(result.map(satellite => satellite.name))
      .toEqual(['Alpha Sat', 'Zulu Sat']);

    expect(satellites.map(satellite => satellite.name))
      .toEqual(['Zulu Sat', 'Alpha Sat']);
  });

  it('should select the requested satellite', () => {
    const satellites = [
      createSatellite(1, 'Satellite A', 'ACTIF'),
      createSatellite(2, 'Satellite B', 'INACTIF')
    ];

    expect(service.selectSatellite(satellites, 2)?.id)
      .toBe(2);
  });

  it('should select an active satellite when the requested satellite is absent', () => {
    const satellites = [
      createSatellite(1, 'Satellite A', 'INACTIF'),
      createSatellite(2, 'Satellite B', 'ACTIF')
    ];

    expect(service.selectSatellite(satellites, 99)?.id)
      .toBe(2);
  });

  it('should select the first satellite when none is active', () => {
    const satellites = [
      createSatellite(1, 'Satellite A', 'INACTIF'),
      createSatellite(2, 'Satellite B', 'INACTIF')
    ];

    expect(service.selectSatellite(satellites, null)?.id)
      .toBe(1);
  });

  it('should return null when the satellite list is empty', () => {
    expect(service.selectSatellite([], null))
      .toBeNull();
  });
});
