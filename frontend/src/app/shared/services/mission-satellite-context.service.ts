import { Injectable } from '@angular/core';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';

@Injectable({
  providedIn: 'root'
})
export class MissionSatelliteContextService {
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
