import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { Satellite } from '../../satellites/models/satellite.model';
import { SatelliteService } from '../../satellites/services/satellite.service';
import {
  MissionSatelliteSelectorComponent
} from '../../shared/mission-satellite-selector/mission-satellite-selector.component';
import {
  MissionSatelliteContextService
} from '../../shared/services/mission-satellite-context.service';
import {
  SimulationListItemResponse,
  SimulationType
} from '../../simulations/models/simulation.model';
import { SimulationService } from '../../simulations/services/simulation.service';
import { TelemetryService } from '../../telemetry/services/telemetry.service';

type ExportFormat = 'csv' | 'pdf';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MissionSatelliteSelectorComponent
  ],
  templateUrl: './report-page.component.html',
  styleUrl: './report-page.component.css'
})
export class ReportPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly satelliteService = inject(SatelliteService);
  private readonly contextService =
    inject(MissionSatelliteContextService);
  private readonly simulationService = inject(SimulationService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  satellites: Satellite[] = [];
  simulations: SimulationListItemResponse[] = [];

  availableMetrics: string[] = [];
  selectedMetrics: string[] = [];

  selectedMissionId: number | null = null;
  selectedSatelliteId: number | null = null;
  selectedSimulationId: number | null = null;

  telemetryFrom = '';
  telemetryTo = '';

  missionsLoading = false;
  satellitesLoading = false;
  metricsLoading = false;
  simulationsLoading = false;

  missionExportLoading = false;
  telemetryCsvLoading = false;
  telemetryPdfLoading = false;
  simulationCsvLoading = false;
  simulationPdfLoading = false;

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

  get selectedSimulation(): SimulationListItemResponse | null {
    return this.simulations.find(
      simulation => simulation.id === this.selectedSimulationId
    ) ?? null;
  }

  get anyExportLoading(): boolean {
    return (
      this.missionExportLoading ||
      this.telemetryCsvLoading ||
      this.telemetryPdfLoading ||
      this.simulationCsvLoading ||
      this.simulationPdfLoading
    );
  }

  loadMissions(): void {
    this.missionsLoading = true;
    this.errorMessage = '';

    this.missionService.findAll().subscribe({
      next: missions => {
        this.missions =
          this.contextService.sortMissions(missions);

        this.missionsLoading = false;
        this.initializeMissionSelection();
      },
      error: error => {
        this.missionsLoading = false;

        this.handleError(
          error,
          'Impossible de charger les missions.'
        );
      }
    });
  }

  onMissionChange(): void {
    this.satellites = [];
    this.simulations = [];
    this.availableMetrics = [];
    this.selectedMetrics = [];

    this.selectedSatelliteId = null;
    this.selectedSimulationId = null;

    this.errorMessage = '';
    this.successMessage = '';

    this.updateQueryParams(
      this.selectedMissionId,
      null
    );

    if (this.selectedMissionId) {
      this.loadSatellites(this.selectedMissionId);
    }
  }

  loadSatellites(missionId: number): void {
    this.satellitesLoading = true;
    this.errorMessage = '';

    this.satelliteService.findByMission(missionId).subscribe({
      next: satellites => {
        this.satellites =
          this.contextService.sortSatellites(satellites);

        this.satellitesLoading = false;
        this.initializeSatelliteSelection();
      },
      error: error => {
        this.satellitesLoading = false;

        this.handleError(
          error,
          'Impossible de charger les satellites.'
        );
      }
    });
  }

  onSatelliteChange(): void {
    this.simulations = [];
    this.availableMetrics = [];
    this.selectedMetrics = [];
    this.selectedSimulationId = null;

    this.errorMessage = '';
    this.successMessage = '';

    this.updateQueryParams(
      this.selectedMissionId,
      this.selectedSatelliteId
    );

    if (!this.selectedSatelliteId) {
      return;
    }

    this.loadSatelliteReportData(
      this.selectedSatelliteId
    );
  }

  private loadSatelliteReportData(
    satelliteId: number
  ): void {
    this.loadMetrics(satelliteId);
    this.loadSimulations(satelliteId);
  }

  loadMetrics(satelliteId: number): void {
    this.metricsLoading = true;

    this.telemetryService
      .getAvailableMetrics(satelliteId)
      .subscribe({
        next: metrics => {
          this.availableMetrics = [...metrics].sort(
            (first, second) =>
              first.localeCompare(second)
          );

          this.selectedMetrics = [
            ...this.availableMetrics
          ];

          this.metricsLoading = false;
        },
        error: error => {
          this.metricsLoading = false;

          this.handleError(
            error,
            'Impossible de charger les métriques de télémétrie.'
          );
        }
      });
  }


  loadSimulations(satelliteId: number): void {
    this.simulationsLoading = true;

    this.simulationService
      .findBySatellite(satelliteId)
      .subscribe({
        next: simulations => {
          this.simulations = [...simulations].sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
          );

          this.selectedSimulationId =
            this.simulations[0]?.id ?? null;

          this.simulationsLoading = false;
        },
        error: error => {
          this.simulationsLoading = false;

          this.handleError(
            error,
            'Impossible de charger les simulations.'
          );
        }
      });
  }

  refresh(): void {
    if (this.selectedSatelliteId) {
      this.loadSatelliteReportData(
        this.selectedSatelliteId
      );

      return;
    }

    if (this.selectedMissionId) {
      this.loadSatellites(
        this.selectedMissionId
      );

      return;
    }

    this.loadMissions();
  }

  toggleMetric(
    metric: string,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      this.selectedMetrics = [
        ...this.selectedMetrics,
        metric
      ];

      return;
    }

    this.selectedMetrics =
      this.selectedMetrics.filter(
        currentMetric =>
          currentMetric !== metric
      );
  }

  isMetricSelected(
    metric: string
  ): boolean {
    return this.selectedMetrics.includes(metric);
  }

  selectAllMetrics(): void {
    this.selectedMetrics = [
      ...this.availableMetrics
    ];
  }

  clearMetricSelection(): void {
    this.selectedMetrics = [];
  }

  exportMissionReport(): void {
    if (!this.selectedMissionId) {
      this.errorMessage =
        'Sélectionne une mission.';
      return;
    }

    this.missionExportLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.missionService
      .exportReportPdf(this.selectedMissionId)
      .subscribe({
        next: blob => {
          this.missionExportLoading = false;

          const filename =
            `mission-report-${this.selectedMissionId}.pdf`;

          this.downloadBlob(blob, filename);

          this.successMessage =
            'Le rapport de mission PDF a été généré.';
        },
        error: error => {
          this.missionExportLoading = false;

          this.handleError(
            error,
            'Impossible de générer le rapport de mission.'
          );
        }
      });
  }

  exportTelemetry(
    format: ExportFormat
  ): void {
    if (!this.selectedSatelliteId) {
      this.errorMessage =
        'Sélectionne un satellite.';
      return;
    }

    if (this.selectedMetrics.length === 0) {
      this.errorMessage =
        'Sélectionne au moins une métrique.';
      return;
    }

    if (
      this.hasInvalidDate(this.telemetryFrom) ||
      this.hasInvalidDate(this.telemetryTo)
    ) {
      this.errorMessage = 'La période contient une date invalide.';
      return;
    }

    const from =
      this.toIsoDateOrNull(this.telemetryFrom);

    const to =
      this.toIsoDateOrNull(this.telemetryTo);

    if (!this.isDateRangeValid(from, to)) {
      return;
    }

    if (format === 'csv') {
      this.telemetryCsvLoading = true;
    } else {
      this.telemetryPdfLoading = true;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const request = format === 'csv'
      ? this.telemetryService
        .exportTelemetryReportCsv(
          this.selectedSatelliteId,
          this.selectedMetrics,
          from,
          to
        )
      : this.telemetryService
        .exportTelemetryReportPdf(
          this.selectedSatelliteId,
          this.selectedMetrics,
          from,
          to
        );

    request.subscribe({
      next: blob => {
        this.telemetryCsvLoading = false;
        this.telemetryPdfLoading = false;

        const filename =
          `telemetry-report-${this.selectedSatelliteId}.${format}`;

        this.downloadBlob(blob, filename);

        this.successMessage =
          `Le rapport de télémétrie ${format.toUpperCase()} a été généré.`;
      },
      error: error => {
        this.telemetryCsvLoading = false;
        this.telemetryPdfLoading = false;

        this.handleError(
          error,
          `Impossible de générer le rapport de télémétrie ${format.toUpperCase()}.`
        );
      }
    });
  }

  exportSimulation(
    format: ExportFormat
  ): void {
    if (!this.selectedSimulationId) {
      this.errorMessage =
        'Sélectionne une simulation.';
      return;
    }

    if (format === 'csv') {
      this.simulationCsvLoading = true;
    } else {
      this.simulationPdfLoading = true;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const request = format === 'csv'
      ? this.simulationService
        .exportCsv(this.selectedSimulationId)
      : this.simulationService
        .exportPdf(this.selectedSimulationId);

    request.subscribe({
      next: blob => {
        this.simulationCsvLoading = false;
        this.simulationPdfLoading = false;

        const filename =
          `simulation-${this.selectedSimulationId}.${format}`;

        this.downloadBlob(blob, filename);

        this.successMessage =
          `L’export de simulation ${format.toUpperCase()} a été généré.`;
      },
      error: error => {
        this.simulationCsvLoading = false;
        this.simulationPdfLoading = false;

        this.handleError(
          error,
          `Impossible de générer l’export de simulation ${format.toUpperCase()}.`
        );
      }
    });
  }

  getSimulationTypeLabel(
    type: SimulationType
  ): string {
    return type === 'ORBIT'
      ? 'Simulation orbitale'
      : 'Transfert de Hohmann';
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

  trackByMetric(
    index: number,
    metric: string
  ): string {
    return metric;
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
      this.route.snapshot.queryParamMap.get(
        'missionId'
      )
    );

    const missionFromQuery = this.missions.find(
      mission =>
        mission.id === missionIdFromQuery
    );

    const defaultMission =
      missionFromQuery ??
      this.missions.find(
        mission => mission.status === 'ACTIVE'
      ) ??
      this.missions[0];

    this.selectedMissionId = defaultMission.id;

    this.loadSatellites(
      defaultMission.id
    );
  }

  private initializeSatelliteSelection(): void {
    if (this.satellites.length === 0) {
      this.selectedSatelliteId = null;
      this.selectedSimulationId = null;

      this.updateQueryParams(
        this.selectedMissionId,
        null
      );

      return;
    }

    const satelliteIdFromQuery = Number(
      this.route.snapshot.queryParamMap.get(
        'satelliteId'
      )
    );

    const satelliteFromQuery =
      this.satellites.find(
        satellite =>
          satellite.id === satelliteIdFromQuery
      );

    const defaultSatellite =
      satelliteFromQuery ??
      this.satellites.find(
        satellite =>
          satellite.status === 'ACTIF'
      ) ??
      this.satellites[0];

    this.selectedSatelliteId =
      defaultSatellite.id;

    this.updateQueryParams(
      this.selectedMissionId,
      defaultSatellite.id
    );

    this.loadSatelliteReportData(
      defaultSatellite.id
    );
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

  private toIsoDateOrNull(
    value: string
  ): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      this.errorMessage = 'La date saisie est invalide.';
      return null;
    }

    return date.toISOString();
  }

  private isDateRangeValid(
    from: string | null,
    to: string | null
  ): boolean {
    if (
      from &&
      to &&
      new Date(from).getTime() >
      new Date(to).getTime()
    ) {
      this.errorMessage =
        'La date de début doit précéder la date de fin.';

      return false;
    }

    return true;
  }

  private hasInvalidDate(value: string): boolean {
    if (!value) {
      return false;
    }

    return Number.isNaN(new Date(value).getTime());
  }

  private handleError(
    error: any,
    fallbackMessage: string
  ): void {
    if (error.status === 403) {
      this.router.navigate(['/forbidden']);
      return;
    }

    if (error.status === 404) {
      this.errorMessage =
        'Mission, satellite ou simulation introuvable.';
      return;
    }

    if (
      error.status === 400 &&
      typeof error.error === 'string'
    ) {
      this.errorMessage = error.error;
      return;
    }

    this.errorMessage = fallbackMessage;
  }

  private downloadBlob(
    blob: Blob,
    filename: string
  ): void {
    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }
}
