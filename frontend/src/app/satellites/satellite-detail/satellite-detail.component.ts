import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Satellite, SatelliteUpdateRequest } from '../models/satellite.model';
import { SatelliteService } from '../services/satellite.service';
import { SimulationResponse, OrbitPlotPoint } from '../../simulations/models/simulation.model';
import { SimulationService } from '../../simulations/services/simulation.service';

@Component({
  selector: 'app-satellite-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './satellite-detail.component.html',
  styleUrl: './satellite-detail.component.css'
})
export class SatelliteDetailComponent implements OnInit {

  satellite: Satellite | null = null;

  loading = false;
  saving = false;
  disabling = false;

  errorMessage = '';
  successMessage = '';

  editName = '';
  editMassKg: number | null = null;
  editAltitudeKm: number | null = null;
  editInclinationDeg: number | null = null;
  editEccentricity: number | null = null;

  simulationLaunching = false;
  simulationResult: SimulationResponse | null = null;
  simulationErrorMessage = '';
  orbitPlotPoints: OrbitPlotPoint[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private satelliteService: SatelliteService,
    private simulationService: SimulationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSatellite();
  }

  loadSatellite(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de satellite invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.satelliteService.findById(id).subscribe({
      next: (satellite) => {
        this.satellite = satellite;
        this.editName = satellite.name;
        this.editMassKg = satellite.massKg ?? null;
        this.editAltitudeKm = satellite.altitudeKm ?? null;
        this.editInclinationDeg = satellite.inclinationDeg ?? null;
        this.editEccentricity = satellite.eccentricity ?? null;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 404) {
          this.errorMessage = 'Satellite introuvable.';
          return;
        }

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage = 'Impossible de charger le satellite.';
      }
    });
  }

  canManage(): boolean {
    return this.authService.isAdmin() || this.authService.isOperateur();
  }

  isInactive(): boolean {
    return this.satellite?.status === 'INACTIF';
  }

  canEditSatellite(): boolean {
    return this.canManage() && !this.isInactive();
  }

  updateSatellite(): void {
    if (!this.satellite || !this.canEditSatellite()) {
      return;
    }

    const trimmedName = this.editName.trim();

    if (!trimmedName) {
      this.errorMessage = 'Le nom du satellite est obligatoire.';
      return;
    }

    if (this.editMassKg === null || this.editMassKg <= 0) {
      this.errorMessage = 'La masse doit être supérieure à 0.';
      return;
    }

    if (this.editAltitudeKm === null || this.editAltitudeKm <= 0) {
      this.errorMessage = 'L’altitude doit être supérieure à 0.';
      return;
    }

    if (
      this.editInclinationDeg === null ||
      this.editInclinationDeg < 0 ||
      this.editInclinationDeg > 180
    ) {
      this.errorMessage = 'L’inclinaison doit être comprise entre 0 et 180 degrés.';
      return;
    }

    if (this.editEccentricity === null || this.editEccentricity < 0) {
      this.errorMessage = 'L’excentricité doit être supérieure ou égale à 0.';
      return;
    }

    const request: SatelliteUpdateRequest = {
      name: trimmedName,
      massKg: this.editMassKg,
      altitudeKm: this.editAltitudeKm,
      inclinationDeg: this.editInclinationDeg,
      eccentricity: this.editEccentricity
    };

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.satelliteService.update(this.satellite.id, request).subscribe({
      next: (updatedSatellite) => {
        this.satellite = updatedSatellite;
        this.editName = updatedSatellite.name;
        this.editMassKg = updatedSatellite.massKg ?? null;
        this.editAltitudeKm = updatedSatellite.altitudeKm ?? null;
        this.editInclinationDeg = updatedSatellite.inclinationDeg ?? null;
        this.editEccentricity = updatedSatellite.eccentricity ?? null;
        this.saving = false;
        this.successMessage = 'Satellite modifié avec succès.';
      },
      error: (error) => {
        this.saving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.errorMessage = 'Modification refusée : le satellite est peut-être inactif ou les données sont invalides.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Satellite introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de modifier le satellite.';
      }
    });
  }

  disableSatellite(): void {
    if (!this.satellite || !this.canEditSatellite()) {
      return;
    }

    const confirmed = confirm('Confirmer la désactivation de ce satellite ? Il deviendra non modifiable.');

    if (!confirmed) {
      return;
    }

    this.disabling = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.satelliteService.disable(this.satellite.id).subscribe({
      next: (disabledSatellite) => {
        this.satellite = disabledSatellite;
        this.disabling = false;
        this.successMessage = 'Satellite désactivé avec succès.';
      },
      error: (error) => {
        this.disabling = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Satellite introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de désactiver le satellite.';
      }
    });
  }

  canLaunchOrbitSimulation(): boolean {
    return this.canManage() && this.satellite?.status === 'ACTIF';
  }

  launchOrbitSimulation(): void {
    if (!this.satellite || !this.canLaunchOrbitSimulation()) {
      return;
    }

    this.simulationLaunching = true;
    this.simulationErrorMessage = '';
    this.successMessage = '';
    this.simulationResult = null;
    this.orbitPlotPoints = [];

    this.simulationService.launchOrbitSimulation(this.satellite.id).subscribe({
      next: (simulation) => {
        this.simulationLaunching = false;
        this.simulationResult = simulation;
        this.orbitPlotPoints = this.parsePlotData(simulation.plotDataJson);
        this.successMessage = 'Simulation orbitale lancée avec succès.';
      },
      error: (error) => {
        this.simulationLaunching = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.simulationErrorMessage = 'Satellite introuvable.';
          return;
        }

        if (error.status === 400 || error.status === 409) {
          this.simulationErrorMessage = 'Simulation refusée : satellite inactif, mission clôturée ou paramètres invalides.';
          return;
        }

        this.simulationErrorMessage = 'Impossible de lancer la simulation orbitale.';
      }
    });
  }

  private parsePlotData(plotDataJson: string): OrbitPlotPoint[] {
    try {
      const parsed = JSON.parse(plotDataJson);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((point) => typeof point.x === 'number' && typeof point.y === 'number')
        .map((point) => ({
          x: point.x,
          y: point.y
        }));
    } catch {
      return [];
    }
  }

  showSimulationSection(): boolean {
    return this.canLaunchOrbitSimulation() || this.simulationResult !== null;
  }

  getOrbitEllipse(): {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  } {
    const eccentricity = this.simulationResult?.inputEccentricity ?? 0;

    const cx = 160;
    const cy = 160;

    const maxRadius = 115;

    const safeEccentricity = Math.min(Math.max(eccentricity, 0), 0.85);

    const rx = maxRadius;
    const ry = maxRadius * Math.sqrt(1 - safeEccentricity * safeEccentricity);

    return {
      cx,
      cy,
      rx,
      ry
    };
  }

  getEarthRadius(): number {
    const altitude =
      this.simulationResult?.inputAltitudeKm ??
      this.satellite?.altitudeKm ??
      400;

    const minRadius = 8;
    const maxRadius = 26;
    const referenceAltitude = 400;

    const rawRadius = 20 * (referenceAltitude / altitude);

    return Math.max(minRadius, Math.min(maxRadius, rawRadius));
  }

  getSatelliteMarker(): {
    cx: number;
    cy: number;
  } {
    const ellipse = this.getOrbitEllipse();

    return {
      cx: ellipse.cx + ellipse.rx,
      cy: ellipse.cy
    };
  }
}
