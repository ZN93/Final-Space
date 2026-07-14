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
import {
  Satellite,
  SatelliteCreateRequest,
  SatelliteStatus
} from '../models/satellite.model';
import { SatelliteService } from '../services/satellite.service';

type SatelliteStatusFilter = 'ALL' | SatelliteStatus;

@Component({
  selector: 'app-satellite-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './satellite-list-page.component.html',
  styleUrl: './satellite-list-page.component.css'
})
export class SatelliteListPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly satelliteService = inject(SatelliteService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  satellites: Satellite[] = [];

  selectedMissionId: number | null = null;

  searchTerm = '';
  statusFilter: SatelliteStatusFilter = 'ALL';

  missionsLoading = false;
  satellitesLoading = false;
  creating = false;

  errorMessage = '';
  successMessage = '';

  creationPanelOpen = false;

  newSatelliteName = '';
  newSatelliteMassKg: number | null = null;
  newSatelliteAltitudeKm: number | null = null;
  newSatelliteInclinationDeg: number | null = null;
  newSatelliteEccentricity: number | null = null;

  ngOnInit(): void {
    this.loadMissions();
  }

  get selectedMission(): Mission | null {
    return this.missions.find(
      mission => mission.id === this.selectedMissionId
    ) ?? null;
  }

  get filteredSatellites(): Satellite[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.satellites.filter(satellite => {
      const matchesSearch =
        !normalizedSearch ||
        satellite.name.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        satellite.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get activeSatelliteCount(): number {
    return this.satellites.filter(
      satellite => satellite.status === 'ACTIF'
    ).length;
  }

  get inactiveSatelliteCount(): number {
    return this.satellites.filter(
      satellite => satellite.status === 'INACTIF'
    ).length;
  }

  get canManage(): boolean {
    return (
      this.authService.isAdmin() ||
      this.authService.isOperateur()
    );
  }

  get canCreateSatellite(): boolean {
    return (
      this.canManage &&
      this.selectedMission !== null &&
      this.selectedMission.status === 'ACTIVE'
    );
  }

  loadMissions(): void {
    this.missionsLoading = true;
    this.errorMessage = '';

    this.missionService.findAll().subscribe({
      next: missions => {
        this.missions = [...missions].sort((first, second) =>
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
    this.closeCreationPanel();
    this.satellites = [];
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.selectedMissionId) {
      this.updateMissionQueryParam(null);
      return;
    }

    this.updateMissionQueryParam(this.selectedMissionId);
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

  refresh(): void {
    if (!this.selectedMissionId) {
      this.loadMissions();
      return;
    }

    this.loadSatellites(this.selectedMissionId);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
  }

  openCreationPanel(): void {
    if (!this.canCreateSatellite) {
      return;
    }

    this.resetCreationForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.creationPanelOpen = true;
  }

  closeCreationPanel(): void {
    if (this.creating) {
      return;
    }

    this.creationPanelOpen = false;
    this.resetCreationForm();
  }

  createSatellite(): void {
    if (
      !this.selectedMissionId ||
      !this.canCreateSatellite
    ) {
      return;
    }

    const validationError = this.validateCreationForm();

    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    const request: SatelliteCreateRequest = {
      name: this.newSatelliteName.trim(),
      massKg: this.newSatelliteMassKg,
      altitudeKm: this.newSatelliteAltitudeKm,
      inclinationDeg: this.newSatelliteInclinationDeg,
      eccentricity: this.newSatelliteEccentricity
    };

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.satelliteService
      .create(this.selectedMissionId, request)
      .subscribe({
        next: createdSatellite => {
          this.satellites = [
            ...this.satellites,
            createdSatellite
          ].sort((first, second) =>
            first.name.localeCompare(second.name)
          );

          this.creating = false;
          this.creationPanelOpen = false;
          this.resetCreationForm();

          this.successMessage =
            `Le satellite ${createdSatellite.name} a été créé.`;
        },
        error: error => {
          this.creating = false;

          if (error.status === 403) {
            this.router.navigate(['/forbidden']);
            return;
          }

          if (error.status === 404) {
            this.errorMessage = 'Mission introuvable.';
            return;
          }

          if (
            error.status === 400 ||
            error.status === 409
          ) {
            this.errorMessage =
              typeof error.error === 'string'
                ? error.error
                : 'Création refusée : vérifie les données et le statut de la mission.';
            return;
          }

          this.errorMessage =
            'Impossible de créer le satellite.';
        }
      });
  }

  formatNumber(
    value: number | null | undefined,
    unit: string
  ): string {
    if (value === null || value === undefined) {
      return 'Non renseigné';
    }

    return `${value.toLocaleString('fr-FR')} ${unit}`;
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

  private initializeMissionSelection(): void {
    if (this.missions.length === 0) {
      this.selectedMissionId = null;
      this.satellites = [];
      return;
    }

    const queryMissionId = Number(
      this.route.snapshot.queryParamMap.get('missionId')
    );

    const missionFromQuery = this.missions.find(
      mission => mission.id === queryMissionId
    );

    const defaultMission =
      missionFromQuery ??
      this.missions.find(
        mission => mission.status === 'ACTIVE'
      ) ??
      this.missions[0];

    this.selectedMissionId = defaultMission.id;
    this.updateMissionQueryParam(defaultMission.id);
    this.loadSatellites(defaultMission.id);
  }

  private updateMissionQueryParam(
    missionId: number | null
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        missionId
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private validateCreationForm(): string | null {
    if (!this.newSatelliteName.trim()) {
      return 'Le nom du satellite est obligatoire.';
    }

    if (
      this.newSatelliteMassKg === null ||
      this.newSatelliteMassKg <= 0
    ) {
      return 'La masse doit être supérieure à 0 kg.';
    }

    if (
      this.newSatelliteAltitudeKm === null ||
      this.newSatelliteAltitudeKm <= 0
    ) {
      return 'L’altitude doit être supérieure à 0 km.';
    }

    if (
      this.newSatelliteInclinationDeg === null ||
      this.newSatelliteInclinationDeg < 0 ||
      this.newSatelliteInclinationDeg > 180
    ) {
      return 'L’inclinaison doit être comprise entre 0 et 180 degrés.';
    }

    if (
      this.newSatelliteEccentricity === null ||
      this.newSatelliteEccentricity < 0 ||
      this.newSatelliteEccentricity >= 1
    ) {
      return 'L’excentricité doit être comprise entre 0 inclus et 1 exclu.';
    }

    return null;
  }

  private resetCreationForm(): void {
    this.newSatelliteName = '';
    this.newSatelliteMassKg = null;
    this.newSatelliteAltitudeKm = null;
    this.newSatelliteInclinationDeg = null;
    this.newSatelliteEccentricity = null;
  }
}
