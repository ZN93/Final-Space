import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';

@Injectable({
  providedIn: 'root'
})
export class MissionSatelliteContextService {
  selectMissionIdFromRoute(
    route: ActivatedRoute,
    missions: Mission[]
  ): number | null {
    return this.selectMission(
      missions,
      this.readRequestedId(route, 'missionId')
    )?.id ?? null;
  }

  selectSatelliteIdFromRoute(
    route: ActivatedRoute,
    satellites: Satellite[]
  ): number | null {
    return this.selectSatellite(
      satellites,
      this.readRequestedId(route, 'satelliteId')
    )?.id ?? null;
  }

  private readRequestedId(
    route: ActivatedRoute,
    parameterName: 'missionId' | 'satelliteId'
  ): number | null {
    const value = route.snapshot.queryParamMap.get(
      parameterName
    );

    if (value === null || value.trim() === '') {
      return null;
    }

    const id = Number(value);

    return Number.isInteger(id) && id > 0
      ? id
      : null;
  }

  sortMissions(missions: Mission[]): Mission[] {
    return [...missions].sort(
      (first, second) => first.name.localeCompare(second.name)
    );
  }

  sortSatellites(satellites: Satellite[]): Satellite[] {
    return [...satellites].sort(
      (first, second) => first.name.localeCompare(second.name)
    );
  }

  selectMission(
    missions: Mission[],
    requestedId: number | null
  ): Mission | null {
    if (missions.length === 0) {
      return null;
    }

    return (
      missions.find(mission => mission.id === requestedId) ??
      missions.find(mission => mission.status === 'ACTIVE') ??
      missions[0]
    );
  }

  selectSatellite(
    satellites: Satellite[],
    requestedId: number | null
  ): Satellite | null {
    if (satellites.length === 0) {
      return null;
    }

    return (
      satellites.find(
        satellite => satellite.id === requestedId
      ) ??
      satellites.find(
        satellite => satellite.status === 'ACTIF'
      ) ??
      satellites[0]
    );
  }
}
