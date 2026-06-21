import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Satellite, SatelliteUpdateRequest } from '../models/satellite.model';
import { SatelliteService } from '../services/satellite.service';
import { SimulationService } from '../../simulations/services/simulation.service';
import {
  HohmannPlotData,
  SimulationListItemResponse,
  SimulationResponse,
  OrbitPlotPoint
} from '../../simulations/models/simulation.model';
import { TelemetryService } from '../../telemetry/services/telemetry.service';
import {
  TelemetryImportError,
  TelemetryImportResponse
} from '../../telemetry/models/telemetry-import.model';

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

  hohmannTargetAltitudeKm: number | null = null;
  hohmannLaunching = false;
  hohmannResult: SimulationResponse | null = null;
  hohmannErrorMessage = '';
  hohmannPlotData: HohmannPlotData | null = null;
  simulationHistory: SimulationListItemResponse[] = [];
  simulationHistoryLoading = false;
  simulationHistoryErrorMessage = '';

  selectedTelemetryFile: File | null = null;
  telemetryImporting = false;
  telemetryImportSuccessMessage = '';
  telemetryImportErrorMessage = '';
  telemetryImportErrors: TelemetryImportError[] = [];
  telemetryImportResult: TelemetryImportResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private satelliteService: SatelliteService,
    private simulationService: SimulationService,
    private telemetryService: TelemetryService,
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
        this.loadSimulationHistory(satellite.id);
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

  loadSimulationHistory(satelliteId: number): void {
    this.simulationHistoryLoading = true;
    this.simulationHistoryErrorMessage = '';

    this.simulationService.findBySatellite(satelliteId).subscribe({
      next: (history) => {
        this.simulationHistory = history;
        this.simulationHistoryLoading = false;
      },
      error: (error) => {
        this.simulationHistoryLoading = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.simulationHistoryErrorMessage = 'Historique introuvable pour ce satellite.';
          return;
        }

        this.simulationHistoryErrorMessage = 'Impossible de charger l’historique des simulations.';
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
        this.loadSimulationHistory(simulation.satelliteId);
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

  launchHohmannTransfer(): void {
    if (!this.satellite || !this.hohmannTargetAltitudeKm) {
      this.hohmannErrorMessage = 'Veuillez saisir une altitude cible valide.';
      return;
    }

    if (this.hohmannTargetAltitudeKm <= 0) {
      this.hohmannErrorMessage = 'L’altitude cible doit être supérieure à 0 km.';
      return;
    }

    if (this.hohmannTargetAltitudeKm === this.satellite.altitudeKm) {
      this.hohmannErrorMessage = 'L’altitude cible doit être différente de l’altitude actuelle.';
      return;
    }

    this.hohmannLaunching = true;
    this.hohmannErrorMessage = '';
    this.hohmannResult = null;
    this.hohmannPlotData = null;

    this.simulationService
      .launchHohmannTransfer(this.satellite.id, this.hohmannTargetAltitudeKm)
      .subscribe({
        next: (result) => {
          this.hohmannResult = result;
          this.hohmannPlotData = this.parseHohmannPlotData(result.plotDataJson);
          this.hohmannLaunching = false;
          this.loadSimulationHistory(result.satelliteId);
        },
        error: () => {
          this.hohmannErrorMessage = 'Impossible de lancer la manœuvre de Hohmann.';
          this.hohmannLaunching = false;
        }
      });
  }

  private parseHohmannPlotData(plotDataJson: string): HohmannPlotData | null {
    try {
      const parsed = JSON.parse(plotDataJson) as HohmannPlotData;

      if (
        !Array.isArray(parsed.initialOrbit) ||
        !Array.isArray(parsed.targetOrbit) ||
        !Array.isArray(parsed.transferArc)
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  getHohmannPath(points: OrbitPlotPoint[] | undefined): string {
    if (!points || points.length === 0) {
      return '';
    }

    return points
      .map((point, index) => {
        const normalized = this.normalizeHohmannPoint(point);
        return `${index === 0 ? 'M' : 'L'} ${normalized.x} ${normalized.y}`;
      })
      .join(' ');
  }

  private normalizeHohmannPoint(point: OrbitPlotPoint): { x: number; y: number } {
    const center = 160;
    const scale = 110;

    return {
      x: center + point.x * scale,
      y: center - point.y * scale
    };
  }

  showHohmannSection(): boolean {
    return this.canLaunchOrbitSimulation() || this.hohmannResult !== null;
  }

  getSimulationSummary(simulation: SimulationListItemResponse): string {
    if (simulation.type === 'HOHMANN') {
      const deltaV = simulation.deltaVTotalMS ?? '-';
      const duration = simulation.transferTimeMinutes ?? '-';
      return `Δv total : ${deltaV} m/s · Durée : ${duration} min`;
    }

    const period = simulation.orbitalPeriodMinutes ?? '-';
    const velocity = simulation.averageVelocityKmS ?? '-';
    const shape = simulation.orbitShape ?? '-';
    return `Période : ${period} min · Vitesse : ${velocity} km/s · Forme : ${shape}`;
  }

  getSimulationTypeLabel(type: string): string {
    if (type === 'HOHMANN') {
      return 'Hohmann';
    }

    if (type === 'ORBIT') {
      return 'Orbite';
    }

    return type;
  }

  canImportTelemetry(): boolean {
    return this.canManage() && this.satellite?.status === 'ACTIF';
  }

  onTelemetryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedTelemetryFile = file;
    this.telemetryImportSuccessMessage = '';
    this.telemetryImportErrorMessage = '';
    this.telemetryImportErrors = [];
    this.telemetryImportResult = null;
  }

  importTelemetryCsv(): void {
    if (!this.satellite || !this.canImportTelemetry()) {
      return;
    }

    if (!this.selectedTelemetryFile) {
      this.telemetryImportErrorMessage = 'Veuillez sélectionner un fichier CSV.';
      this.telemetryImportErrors = [];
      return;
    }

    if (!this.selectedTelemetryFile.name.toLowerCase().endsWith('.csv')) {
      this.telemetryImportErrorMessage = 'Le fichier doit être au format CSV.';
      this.telemetryImportErrors = [];
      return;
    }

    this.telemetryImporting = true;
    this.telemetryImportSuccessMessage = '';
    this.telemetryImportErrorMessage = '';
    this.telemetryImportErrors = [];
    this.telemetryImportResult = null;

    this.telemetryService
      .importCsv(
        this.satellite.missionId,
        this.satellite.id,
        this.selectedTelemetryFile
      )
      .subscribe({
        next: (result) => {
          this.telemetryImporting = false;
          this.telemetryImportResult = result;
          this.telemetryImportSuccessMessage =
            `${result.importedCount} point(s) de télémétrie importé(s) avec succès.`;
        },
        error: (error) => {
          this.telemetryImporting = false;

          if (error.status === 403) {
            this.router.navigate(['/forbidden']);
            return;
          }

          if (error.status === 400 && error.error?.errors) {
            this.telemetryImportErrorMessage = 'Le fichier CSV contient des erreurs.';
            this.telemetryImportErrors = error.error.errors;
            return;
          }

          if (error.status === 404) {
            this.telemetryImportErrorMessage = 'Satellite ou mission introuvable.';
            return;
          }

          this.telemetryImportErrorMessage = 'Impossible d’importer le fichier de télémétrie.';
        }
      });
  }
}
