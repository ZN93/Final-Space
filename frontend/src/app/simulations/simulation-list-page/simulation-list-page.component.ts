import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { Satellite } from '../../satellites/models/satellite.model';
import { SatelliteService } from '../../satellites/services/satellite.service';
import {
  SimulationListItemResponse,
  SimulationResponse,
  SimulationStatus,
  SimulationType
} from '../models/simulation.model';
import { SimulationService } from '../services/simulation.service';

type SimulationTypeFilter = 'ALL' | SimulationType;
type SimulationStatusFilter = 'ALL' | SimulationStatus;

@Component({
  selector: 'app-simulation-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './simulation-list-page.component.html',
  styleUrl: './simulation-list-page.component.css'
})
export class SimulationListPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly satelliteService = inject(SatelliteService);
  private readonly simulationService = inject(SimulationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  satellites: Satellite[] = [];
  simulations: SimulationListItemResponse[] = [];

  selectedMissionId: number | null = null;
  selectedSatelliteId: number | null = null;

  typeFilter: SimulationTypeFilter = 'ALL';
  statusFilter: SimulationStatusFilter = 'ALL';
  searchTerm = '';

  missionsLoading = false;
  satellitesLoading = false;
  simulationsLoading = false;

  launchingOrbit = false;
  launchingHohmann = false;

  launchPanelOpen = false;
  selectedLaunchType: SimulationType = 'ORBIT';
  targetAltitudeKm: number | null = null;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadMissions();
  }

  get selectedMission(): Mission | null {
    return this.missions.find(
      mission => mission.id === this.selectedMissionId
    ) ?? null;
  }

  get selectedSatellite(): Satellite | null {
    return this.satellites.find(
      satellite => satellite.id === this.selectedSatelliteId
    ) ?? null;
  }

  get filteredSimulations(): SimulationListItemResponse[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.simulations.filter(simulation => {
      const matchesSearch =
        !normalizedSearch ||
        simulation.satelliteName
          .toLowerCase()
          .includes(normalizedSearch) ||
        simulation.createdBy
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        this.typeFilter === 'ALL' ||
        simulation.type === this.typeFilter;

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        simulation.status === this.statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  get successCount(): number {
    return this.simulations.filter(
      simulation => simulation.status === 'SUCCESS'
    ).length;
  }

  get failedCount(): number {
    return this.simulations.filter(
      simulation => simulation.status === 'FAILED'
    ).length;
  }

  get orbitCount(): number {
    return this.simulations.filter(
      simulation => simulation.type === 'ORBIT'
    ).length;
  }

  get hohmannCount(): number {
    return this.simulations.filter(
      simulation => simulation.type === 'HOHMANN'
    ).length;
  }

  get canManage(): boolean {
    return (
      this.authService.isAdmin() ||
      this.authService.isOperateur()
    );
  }

  get canLaunchSimulation(): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE' &&
      this.selectedSatellite?.status === 'ACTIF'
    );
  }

  get launchInProgress(): boolean {
    return this.launchingOrbit || this.launchingHohmann;
  }

  loadMissions(): void {
    this.missionsLoading = true;
    this.errorMessage = '';

    this.missionService.findAll().subscribe({
      next: missions => {
        this.missions = [...missions].sort(
          (first, second) =>
            first.name.localeCompare(second.name)
        );

        this.missionsLoading = false;
        this.initializeMissionSelection();
      },
      error: error => {
        this.missionsLoading = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage =
          'Impossible de charger les missions.';
      }
    });
  }

  onMissionChange(): void {
    this.satellites = [];
    this.simulations = [];
    this.selectedSatelliteId = null;
    this.closeLaunchPanel();
    this.errorMessage = '';
    this.successMessage = '';

    this.updateQueryParams(
      this.selectedMissionId,
      null
    );

    if (!this.selectedMissionId) {
      return;
    }

    this.loadSatellites(this.selectedMissionId);
  }

  loadSatellites(missionId: number): void {
    this.satellitesLoading = true;
    this.errorMessage = '';

    this.satelliteService.findByMission(missionId).subscribe({
      next: satellites => {
        this.satellites = [...satellites].sort(
          (first, second) =>
            first.name.localeCompare(second.name)
        );

        this.satellitesLoading = false;
        this.initializeSatelliteSelection();
      },
      error: error => {
        this.satellitesLoading = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Mission introuvable.';
          return;
        }

        this.errorMessage =
          'Impossible de charger les satellites.';
      }
    });
  }

  onSatelliteChange(): void {
    this.simulations = [];
    this.closeLaunchPanel();
    this.errorMessage = '';
    this.successMessage = '';

    this.updateQueryParams(
      this.selectedMissionId,
      this.selectedSatelliteId
    );

    if (!this.selectedSatelliteId) {
      return;
    }

    this.loadSimulations(this.selectedSatelliteId);
  }

  loadSimulations(satelliteId: number): void {
    this.simulationsLoading = true;
    this.errorMessage = '';

    this.simulationService
      .findBySatellite(satelliteId)
      .subscribe({
        next: simulations => {
          this.simulations = [...simulations].sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
          );

          this.simulationsLoading = false;
        },
        error: error => {
          this.simulationsLoading = false;

          if (error.status === 403) {
            this.router.navigate(['/forbidden']);
            return;
          }

          if (error.status === 404) {
            this.errorMessage = 'Satellite introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger les simulations.';
        }
      });
  }

  refresh(): void {
    if (this.selectedSatelliteId) {
      this.loadSimulations(this.selectedSatelliteId);
      return;
    }

    if (this.selectedMissionId) {
      this.loadSatellites(this.selectedMissionId);
      return;
    }

    this.loadMissions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = 'ALL';
    this.statusFilter = 'ALL';
  }

  openLaunchPanel(type: SimulationType): void {
    if (!this.canLaunchSimulation) {
      return;
    }

    this.selectedLaunchType = type;
    this.targetAltitudeKm = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.launchPanelOpen = true;
  }

  closeLaunchPanel(): void {
    if (this.launchInProgress) {
      return;
    }

    this.launchPanelOpen = false;
    this.targetAltitudeKm = null;
  }

  launchSimulation(): void {
    if (
      !this.selectedSatelliteId ||
      !this.canLaunchSimulation
    ) {
      return;
    }

    if (this.selectedLaunchType === 'ORBIT') {
      this.launchOrbitSimulation(
        this.selectedSatelliteId
      );
      return;
    }

    this.launchHohmannSimulation(
      this.selectedSatelliteId
    );
  }

  getTypeLabel(type: SimulationType): string {
    return type === 'ORBIT'
      ? 'Simulation orbitale'
      : 'Transfert de Hohmann';
  }

  getStatusLabel(status: SimulationStatus): string {
    return status === 'SUCCESS'
      ? 'Réussie'
      : 'Échouée';
  }

  getSimulationSummary(
    simulation: SimulationListItemResponse
  ): string {
    if (simulation.type === 'HOHMANN') {
      const deltaV =
        simulation.deltaVTotalMS === null
          ? 'Non disponible'
          : `${simulation.deltaVTotalMS.toLocaleString('fr-FR')} m/s`;

      const duration =
        simulation.transferTimeMinutes === null
          ? 'Non disponible'
          : `${simulation.transferTimeMinutes.toLocaleString('fr-FR')} min`;

      return `Δv total : ${deltaV} · Durée : ${duration}`;
    }

    const period =
      simulation.orbitalPeriodMinutes === null
        ? 'Non disponible'
        : `${simulation.orbitalPeriodMinutes.toLocaleString('fr-FR')} min`;

    const velocity =
      simulation.averageVelocityKmS === null
        ? 'Non disponible'
        : `${simulation.averageVelocityKmS.toLocaleString('fr-FR')} km/s`;

    return `Période : ${period} · Vitesse : ${velocity}`;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  trackByMissionId(
    index: number,
    mission: Mission
  ): number {
    return mission.id;
  }

  trackBySatelliteId(
    index: number,
    satellite: Satellite
  ): number {
    return satellite.id;
  }

  trackBySimulationId(
    index: number,
    simulation: SimulationListItemResponse
  ): number {
    return simulation.id;
  }

  private initializeMissionSelection(): void {
    if (this.missions.length === 0) {
      this.selectedMissionId = null;
      return;
    }

    const missionIdFromQuery = Number(
      this.route.snapshot.queryParamMap.get('missionId')
    );

    const missionFromQuery = this.missions.find(
      mission => mission.id === missionIdFromQuery
    );

    const defaultMission =
      missionFromQuery ??
      this.missions.find(
        mission => mission.status === 'ACTIVE'
      ) ??
      this.missions[0];

    this.selectedMissionId = defaultMission.id;
    this.loadSatellites(defaultMission.id);
  }

  private initializeSatelliteSelection(): void {
    if (this.satellites.length === 0) {
      this.selectedSatelliteId = null;
      this.simulations = [];

      this.updateQueryParams(
        this.selectedMissionId,
        null
      );

      return;
    }

    const satelliteIdFromQuery = Number(
      this.route.snapshot.queryParamMap.get('satelliteId')
    );

    const satelliteFromQuery = this.satellites.find(
      satellite =>
        satellite.id === satelliteIdFromQuery
    );

    const defaultSatellite =
      satelliteFromQuery ??
      this.satellites.find(
        satellite => satellite.status === 'ACTIF'
      ) ??
      this.satellites[0];

    this.selectedSatelliteId = defaultSatellite.id;

    this.updateQueryParams(
      this.selectedMissionId,
      defaultSatellite.id
    );

    this.loadSimulations(defaultSatellite.id);
  }

  private updateQueryParams(
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

  private launchOrbitSimulation(
    satelliteId: number
  ): void {
    this.launchingOrbit = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.simulationService
      .launchOrbitSimulation(satelliteId)
      .subscribe({
        next: simulation => {
          this.handleLaunchSuccess(simulation);
          this.launchingOrbit = false;
        },
        error: error => {
          this.launchingOrbit = false;
          this.handleLaunchError(error);
        }
      });
  }

  private launchHohmannSimulation(
    satelliteId: number
  ): void {
    if (
      this.targetAltitudeKm === null ||
      this.targetAltitudeKm <= 0
    ) {
      this.errorMessage =
        'L’altitude cible doit être supérieure à 0 km.';
      return;
    }

    if (
      this.targetAltitudeKm ===
      this.selectedSatellite?.altitudeKm
    ) {
      this.errorMessage =
        'L’altitude cible doit être différente de l’altitude actuelle.';
      return;
    }

    this.launchingHohmann = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.simulationService
      .launchHohmannTransfer(
        satelliteId,
        this.targetAltitudeKm
      )
      .subscribe({
        next: simulation => {
          this.handleLaunchSuccess(simulation);
          this.launchingHohmann = false;
        },
        error: error => {
          this.launchingHohmann = false;
          this.handleLaunchError(error);
        }
      });
  }

  private handleLaunchSuccess(
    simulation: SimulationResponse
  ): void {
    this.launchPanelOpen = false;
    this.targetAltitudeKm = null;

    this.successMessage =
      `${this.getTypeLabel(simulation.type)} lancée avec succès.`;

    if (this.selectedSatelliteId) {
      this.loadSimulations(this.selectedSatelliteId);
    }
  }

  private handleLaunchError(error: any): void {
    if (error.status === 403) {
      this.router.navigate(['/forbidden']);
      return;
    }

    if (error.status === 404) {
      this.errorMessage = 'Satellite introuvable.';
      return;
    }

    if (
      error.status === 400 ||
      error.status === 409
    ) {
      this.errorMessage =
        typeof error.error === 'string'
          ? error.error
          : 'Simulation refusée : vérifie le satellite, la mission et les paramètres orbitaux.';
      return;
    }

    this.errorMessage =
      'Impossible de lancer la simulation.';
  }
}
