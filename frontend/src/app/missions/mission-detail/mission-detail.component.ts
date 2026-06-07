import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Mission } from '../models/mission.model';
import { MissionService } from '../services/mission.service';
import { AuthService } from '../../auth/auth.service';
import { Satellite, SatelliteUpdateRequest } from '../../satellites/models/satellite.model';
import { SatelliteService } from '../../satellites/services/satellite.service';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-detail.component.html',
  styleUrl: './mission-detail.component.css'
})
export class MissionDetailComponent implements OnInit {

  mission: Mission | null = null;

  name = '';
  description = '';

  loading = false;
  saving = false;
  closing = false;

  errorMessage = '';
  successMessage = '';

  satellites: Satellite[] = [];
  satellitesLoading = false;
  satellitesErrorMessage = '';

  showSatelliteForm = false;

  satelliteName = '';
  satelliteMassKg: number | null = null;
  satelliteAltitudeKm: number | null = null;
  satelliteInclinationDeg: number | null = null;
  satelliteEccentricity: number | null = null;

  satelliteSaving = false;
  satelliteFormErrorMessage = '';

  editingSatelliteId: number | null = null;

  editSatelliteName = '';
  editSatelliteMassKg: number | null = null;
  editSatelliteAltitudeKm: number | null = null;
  editSatelliteInclinationDeg: number | null = null;
  editSatelliteEccentricity: number | null = null;

  satelliteUpdateSaving = false;
  satelliteDisableSaving = false;
  satelliteEditErrorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionService,
    private satelliteService: SatelliteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMission();
  }

  loadMission(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de mission invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.missionService.findById(id).subscribe({
      next: (mission) => {
        this.mission = mission;
        this.name = mission.name;
        this.description = mission.description || '';
        this.loading = false;
        this.loadSatellites(mission.id);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 404) {
          this.errorMessage = 'Mission introuvable.';
          return;
        }

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage = 'Impossible de charger la mission.';
      }
    });
  }

  updateMission(): void {
    if (!this.mission || !this.canEdit()) {
      return;
    }

    const trimmedName = this.name.trim();

    if (!trimmedName) {
      this.errorMessage = 'Le nom de la mission est obligatoire.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.missionService.update(this.mission.id, {
      name: trimmedName,
      description: this.description.trim()
    }).subscribe({
      next: (updatedMission) => {
        this.mission = updatedMission;
        this.name = updatedMission.name;
        this.description = updatedMission.description || '';
        this.saving = false;
        this.successMessage = 'Mission modifiée avec succès.';
      },
      error: (error) => {
        this.saving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.errorMessage = 'Modification refusée : la mission est peut-être clôturée ou les données sont invalides.';
          return;
        }

        this.errorMessage = 'Impossible de modifier la mission.';
      }
    });
  }

  closeMission(): void {
    if (!this.mission || !this.canClose()) {
      return;
    }

    const confirmed = confirm('Confirmer la clôture de cette mission ? Cette action rendra la mission non modifiable.');

    if (!confirmed) {
      return;
    }

    this.closing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.missionService.close(this.mission.id).subscribe({
      next: (closedMission) => {
        this.mission = closedMission;
        this.name = closedMission.name;
        this.description = closedMission.description || '';
        this.closing = false;
        this.successMessage = 'Mission clôturée avec succès.';
      },
      error: (error) => {
        this.closing = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage = 'Impossible de clôturer la mission.';
      }
    });
  }

  canManage(): boolean {
    return this.authService.isAdmin() || this.authService.isOperateur();
  }

  isClosed(): boolean {
    return this.mission?.status === 'CLOTUREE';
  }

  canEdit(): boolean {
    return this.canManage() && !this.isClosed();
  }

  canClose(): boolean {
    return this.canManage() && !this.isClosed();
  }

  isReadOnly(): boolean {
    return !this.canEdit();
  }

  loadSatellites(missionId: number): void {
    this.satellitesLoading = true;
    this.satellitesErrorMessage = '';

    this.satelliteService.findByMission(missionId).subscribe({
      next: (satellites) => {
        this.satellites = satellites;
        this.satellitesLoading = false;
      },
      error: () => {
        this.satellitesErrorMessage = 'Impossible de charger les satellites de la mission.';
        this.satellitesLoading = false;
      }
    });
  }

  canCreateSatellite(): boolean {
    return this.canManage() && !this.isClosed();
  }

  isSatelliteInactive(satellite: Satellite): boolean {
    return satellite.status === 'INACTIF';
  }

  toggleSatelliteForm(): void {
    this.showSatelliteForm = !this.showSatelliteForm;
    this.satelliteFormErrorMessage = '';
  }

  createSatellite(): void {
    if (!this.mission || !this.canCreateSatellite()) {
      return;
    }

    const trimmedName = this.satelliteName.trim();

    if (!trimmedName) {
      this.satelliteFormErrorMessage = 'Le nom du satellite est obligatoire.';
      return;
    }

    this.satelliteSaving = true;
    this.satelliteFormErrorMessage = '';

    this.satelliteService.create(this.mission.id, {
      name: trimmedName,
      massKg: this.satelliteMassKg,
      altitudeKm: this.satelliteAltitudeKm,
      inclinationDeg: this.satelliteInclinationDeg,
      eccentricity: this.satelliteEccentricity
    }).subscribe({
      next: () => {
        this.satelliteSaving = false;
        this.showSatelliteForm = false;

        this.satelliteName = '';
        this.satelliteMassKg = null;
        this.satelliteAltitudeKm = null;
        this.satelliteInclinationDeg = null;
        this.satelliteEccentricity = null;

        if (this.mission) {
          this.loadSatellites(this.mission.id);
        }
      },
      error: (error) => {
        this.satelliteSaving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.satelliteFormErrorMessage = 'Les données saisies sont invalides ou la mission est clôturée.';
          return;
        }

        this.satelliteFormErrorMessage = 'Impossible de créer le satellite.';
      }
    });
  }

  startEditSatellite(satellite: Satellite): void {
    if (!this.canManage() || this.isSatelliteInactive(satellite)) {
      return;
    }

    this.editingSatelliteId = satellite.id;
    this.editSatelliteName = satellite.name;
    this.editSatelliteMassKg = satellite.massKg ?? null;
    this.editSatelliteAltitudeKm = satellite.altitudeKm ?? null;
    this.editSatelliteInclinationDeg = satellite.inclinationDeg ?? null;
    this.editSatelliteEccentricity = satellite.eccentricity ?? null;
    this.satelliteEditErrorMessage = '';
  }

  cancelEditSatellite(): void {
    this.editingSatelliteId = null;
    this.editSatelliteName = '';
    this.editSatelliteMassKg = null;
    this.editSatelliteAltitudeKm = null;
    this.editSatelliteInclinationDeg = null;
    this.editSatelliteEccentricity = null;
    this.satelliteEditErrorMessage = '';
  }

  updateSatellite(): void {
    if (!this.editingSatelliteId) {
      return;
    }

    const trimmedName = this.editSatelliteName.trim();

    if (!trimmedName) {
      this.satelliteEditErrorMessage = 'Le nom du satellite est obligatoire.';
      return;
    }

    const request: SatelliteUpdateRequest = {
      name: trimmedName,
      massKg: this.editSatelliteMassKg,
      altitudeKm: this.editSatelliteAltitudeKm,
      inclinationDeg: this.editSatelliteInclinationDeg,
      eccentricity: this.editSatelliteEccentricity
    };

    this.satelliteUpdateSaving = true;
    this.satelliteEditErrorMessage = '';

    this.satelliteService.update(this.editingSatelliteId, request).subscribe({
      next: () => {
        this.satelliteUpdateSaving = false;
        this.cancelEditSatellite();

        if (this.mission) {
          this.loadSatellites(this.mission.id);
        }
      },
      error: (error) => {
        this.satelliteUpdateSaving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.satelliteEditErrorMessage = 'Modification refusée : le satellite est peut-être inactif ou les données sont invalides.';
          return;
        }

        this.satelliteEditErrorMessage = 'Impossible de modifier le satellite.';
      }
    });
  }

  disableSatellite(satellite: Satellite): void {
    if (!this.canManage() || this.isSatelliteInactive(satellite)) {
      return;
    }

    const confirmed = confirm('Confirmer la désactivation de ce satellite ? Il deviendra non modifiable.');

    if (!confirmed) {
      return;
    }

    this.satelliteDisableSaving = true;

    this.satelliteService.disable(satellite.id).subscribe({
      next: () => {
        this.satelliteDisableSaving = false;

        this.cancelEditSatellite();

        if (this.mission) {
          this.loadSatellites(this.mission.id);
        }
      },
      error: (error) => {
        this.satelliteDisableSaving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.satellitesErrorMessage = 'Impossible de désactiver le satellite.';
      }
    });
  }

  canEditSatellite(satellite: Satellite): boolean {
    return this.canManage() && !this.isSatelliteInactive(satellite);
  }


}
