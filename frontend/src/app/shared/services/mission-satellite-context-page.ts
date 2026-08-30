import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';
import { MissionSatelliteContextService } from './mission-satellite-context.service';

interface MissionSatelliteContextState {
  missions: Mission[];
  satellites: Satellite[];
  selectedMissionId: number | null;
  selectedSatelliteId: number | null;
  loadSatellites(missionId: number): void;
}

export abstract class MissionSatelliteContextPage {
  protected readonly contextService =
    inject(MissionSatelliteContextService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  protected abstract get missionSatelliteContextState():
    MissionSatelliteContextState;

  protected abstract applyInitialSatelliteSelection(
    satelliteId: number | null
  ): void;

  protected initializeMissionSelection(): void {
    const state = this.missionSatelliteContextState;

    state.selectedMissionId =
      this.contextService.selectMissionIdFromRoute(
        this.route,
        state.missions
      );

    if (state.selectedMissionId !== null) {
      state.loadSatellites(state.selectedMissionId);
    }
  }

  protected initializeSatelliteSelection(): void {
    const state = this.missionSatelliteContextState;

    state.selectedSatelliteId =
      this.contextService.selectSatelliteIdFromRoute(
        this.route,
        state.satellites
      );

    this.updateQueryParams(
      state.selectedMissionId,
      state.selectedSatelliteId
    );

    this.applyInitialSatelliteSelection(
      state.selectedSatelliteId
    );
  }

  protected updateQueryParams(
    missionId: number | null,
    satelliteId: number | null
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        missionId,
        satelliteId
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
