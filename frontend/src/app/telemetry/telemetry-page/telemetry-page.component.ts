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
  MissionSatelliteSelectorComponent
} from '../../shared/mission-satellite-selector/mission-satellite-selector.component';
import {
  MissionSatelliteContextService
} from '../../shared/services/mission-satellite-context.service';
import {
  TelemetryAnomaly,
  TelemetryAnomalySeverity,
  TelemetryAnomalyType
} from '../models/telemetry-anomaly.model';
import {
  TelemetryImportError,
  TelemetryImportResponse
} from '../models/telemetry-import.model';
import { TelemetryPoint } from '../models/telemetry-query.model';
import { TelemetryService } from '../services/telemetry.service';

interface TelemetryChartPoint {
  x: number;
  y: number;
  timestamp: string;
  value: number;
}

interface TelemetryChartSeries {
  metric: string;
  path: string;
  points: TelemetryChartPoint[];
}

@Component({
  selector: 'app-telemetry-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MissionSatelliteSelectorComponent
  ],
  templateUrl: './telemetry-page.component.html',
  styleUrl: './telemetry-page.component.css'
})
export class TelemetryPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly satelliteService = inject(SatelliteService);
  private readonly contextService =
    inject(MissionSatelliteContextService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  satellites: Satellite[] = [];

  selectedMissionId: number | null = null;
  selectedSatelliteId: number | null = null;

  availableMetrics: string[] = [];
  selectedMetrics: string[] = [];

  telemetryFrom = '';
  telemetryTo = '';

  telemetryPoints: TelemetryPoint[] = [];
  chartSeries: TelemetryChartSeries[] = [];

  anomalies: TelemetryAnomaly[] = [];

  selectedFile: File | null = null;
  importResult: TelemetryImportResponse | null = null;
  importErrors: TelemetryImportError[] = [];

  missionsLoading = false;
  satellitesLoading = false;
  metricsLoading = false;
  telemetryLoading = false;
  anomaliesLoading = false;
  anomalyDetecting = false;
  importing = false;
  csvExportLoading = false;
  pdfExportLoading = false;

  errorMessage = '';
  successMessage = '';

  readonly chartWidth = 1000;
  readonly chartHeight = 360;
  readonly chartPadding = 55;

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

  get canManage(): boolean {
    return (
      this.authService.isAdmin() ||
      this.authService.isOperateur()
    );
  }

  get canModifyTelemetry(): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE' &&
      this.selectedSatellite?.status === 'ACTIF'
    );
  }

  get hasMetrics(): boolean {
    return this.availableMetrics.length > 0;
  }

  get criticalAnomalyCount(): number {
    return this.anomalies.filter(
      anomaly => anomaly.severity === 'ELEVEE'
    ).length;
  }

  get mediumAnomalyCount(): number {
    return this.anomalies.filter(
      anomaly => anomaly.severity === 'MOYENNE'
    ).length;
  }

  get lowAnomalyCount(): number {
    return this.anomalies.filter(
      anomaly => anomaly.severity === 'FAIBLE'
    ).length;
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
    this.selectedSatelliteId = null;
    this.resetTelemetryContext();

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
    this.resetTelemetryContext();

    this.updateQueryParams(
      this.selectedMissionId,
      this.selectedSatelliteId
    );

    if (this.selectedSatelliteId) {
      this.loadMetrics();
    }
  }

  loadMetrics(): void {
    if (!this.selectedSatelliteId) {
      return;
    }

    this.metricsLoading = true;
    this.errorMessage = '';

    this.telemetryService
      .getAvailableMetrics(this.selectedSatelliteId)
      .subscribe({
        next: metrics => {
          this.availableMetrics = [...metrics].sort(
            (first, second) =>
              first.localeCompare(second)
          );

          this.selectedMetrics = [...this.availableMetrics];
          this.metricsLoading = false;

          if (this.availableMetrics.length > 0) {
            this.refreshTelemetry();
            this.loadAnomalies();
          }
        },
        error: error => {
          this.metricsLoading = false;
          this.handleError(
            error,
            'Impossible de charger les métriques.'
          );
        }
      });
  }

  toggleMetric(metric: string, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      this.selectedMetrics = [
        ...this.selectedMetrics,
        metric
      ];

      return;
    }

    this.selectedMetrics = this.selectedMetrics.filter(
      currentMetric => currentMetric !== metric
    );
  }

  isMetricSelected(metric: string): boolean {
    return this.selectedMetrics.includes(metric);
  }

  selectAllMetrics(): void {
    this.selectedMetrics = [...this.availableMetrics];
  }

  clearMetricSelection(): void {
    this.selectedMetrics = [];
    this.telemetryPoints = [];
    this.chartSeries = [];
  }

  refreshTelemetry(): void {
    if (!this.selectedSatelliteId) {
      return;
    }

    if (this.selectedMetrics.length === 0) {
      this.errorMessage =
        'Sélectionne au moins une métrique.';
      this.telemetryPoints = [];
      this.chartSeries = [];
      return;
    }

    const from = this.toIsoDateOrNull(this.telemetryFrom);
    const to = this.toIsoDateOrNull(this.telemetryTo);

    if (!this.isDateRangeValid(from, to)) {
      return;
    }

    this.telemetryLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.telemetryService
      .getTelemetry(
        this.selectedSatelliteId,
        this.selectedMetrics,
        from,
        to
      )
      .subscribe({
        next: response => {
          this.telemetryPoints = response.points;
          this.chartSeries = this.buildChartSeries(
            response.points
          );

          this.telemetryLoading = false;
        },
        error: error => {
          this.telemetryLoading = false;
          this.handleError(
            error,
            'Impossible de charger les données de télémétrie.'
          );
        }
      });
  }

  loadAnomalies(): void {
    if (!this.selectedSatelliteId) {
      return;
    }

    const from = this.toIsoDateOrNull(this.telemetryFrom);
    const to = this.toIsoDateOrNull(this.telemetryTo);

    if (!this.isDateRangeValid(from, to)) {
      return;
    }

    this.anomaliesLoading = true;
    this.errorMessage = '';

    this.telemetryService
      .getAnomalies(
        this.selectedSatelliteId,
        this.selectedMetrics,
        from,
        to
      )
      .subscribe({
        next: response => {
          this.anomalies = [...response.anomalies].sort(
            (first, second) =>
              new Date(second.timestamp).getTime() -
              new Date(first.timestamp).getTime()
          );

          this.anomaliesLoading = false;
        },
        error: error => {
          this.anomaliesLoading = false;
          this.handleError(
            error,
            'Impossible de charger les anomalies.'
          );
        }
      });
  }

  refreshAll(): void {
    this.refreshTelemetry();
    this.loadAnomalies();
  }

  detectAnomalies(): void {
    if (
      !this.selectedSatelliteId ||
      !this.canModifyTelemetry
    ) {
      return;
    }

    if (this.selectedMetrics.length === 0) {
      this.errorMessage =
        'Sélectionne au moins une métrique pour la détection.';
      return;
    }

    const from = this.toIsoDateOrNull(this.telemetryFrom);
    const to = this.toIsoDateOrNull(this.telemetryTo);

    if (!this.isDateRangeValid(from, to)) {
      return;
    }

    this.anomalyDetecting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.telemetryService
      .detectAnomalies(
        this.selectedSatelliteId,
        this.selectedMetrics,
        from,
        to
      )
      .subscribe({
        next: response => {
          this.anomalyDetecting = false;

          this.successMessage =
            `${response.detectedCount} anomalie(s) détectée(s), ` +
            `${response.savedCount} enregistrée(s).`;

          this.loadAnomalies();
        },
        error: error => {
          this.anomalyDetecting = false;
          this.handleError(
            error,
            'Impossible de lancer la détection des anomalies.'
          );
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input.files?.[0] ?? null;
    this.importResult = null;
    this.importErrors = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  importCsv(): void {
    if (
      !this.selectedMissionId ||
      !this.selectedSatelliteId ||
      !this.canModifyTelemetry
    ) {
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage =
        'Sélectionne un fichier CSV.';
      return;
    }

    if (
      !this.selectedFile.name
        .toLowerCase()
        .endsWith('.csv')
    ) {
      this.errorMessage =
        'Le fichier doit être au format CSV.';
      return;
    }

    this.importing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.importResult = null;
    this.importErrors = [];

    this.telemetryService
      .importCsv(
        this.selectedMissionId,
        this.selectedSatelliteId,
        this.selectedFile
      )
      .subscribe({
        next: response => {
          this.importing = false;
          this.importResult = response;
          this.importErrors = response.errors;

          this.successMessage =
            `${response.importedCount} point(s) importé(s).`;

          this.selectedFile = null;
          this.loadMetrics();
        },
        error: error => {
          this.importing = false;

          if (
            error.status === 400 &&
            Array.isArray(error.error?.errors)
          ) {
            this.importErrors = error.error.errors;
            this.errorMessage =
              'Le fichier CSV contient des erreurs.';
            return;
          }

          this.handleError(
            error,
            'Impossible d’importer le fichier CSV.'
          );
        }
      });
  }

  exportReport(format: 'csv' | 'pdf'): void {
    if (
      !this.selectedSatelliteId ||
      this.selectedMetrics.length === 0
    ) {
      this.errorMessage =
        'Sélectionne au moins une métrique à exporter.';
      return;
    }

    const from = this.toIsoDateOrNull(this.telemetryFrom);
    const to = this.toIsoDateOrNull(this.telemetryTo);

    if (!this.isDateRangeValid(from, to)) {
      return;
    }

    const request = format === 'csv'
      ? this.telemetryService.exportTelemetryReportCsv(
        this.selectedSatelliteId,
        this.selectedMetrics,
        from,
        to
      )
      : this.telemetryService.exportTelemetryReportPdf(
        this.selectedSatelliteId,
        this.selectedMetrics,
        from,
        to
      );

    if (format === 'csv') {
      this.csvExportLoading = true;
    } else {
      this.pdfExportLoading = true;
    }

    this.errorMessage = '';
    this.successMessage = '';

    request.subscribe({
      next: blob => {
        this.csvExportLoading = false;
        this.pdfExportLoading = false;

        const filename =
          `telemetry-${this.selectedSatelliteId}.${format}`;

        this.downloadBlob(blob, filename);

        this.successMessage =
          `Rapport ${format.toUpperCase()} généré.`;
      },
      error: error => {
        this.csvExportLoading = false;
        this.pdfExportLoading = false;

        this.handleError(
          error,
          `Impossible de générer l’export ${format.toUpperCase()}.`
        );
      }
    });
  }

  getSeriesStroke(index: number): string {
    const colors = [
      '#38bdf8',
      '#facc15',
      '#22c55e',
      '#f97316',
      '#a855f7',
      '#ef4444'
    ];

    return colors[index % colors.length];
  }

  getAnomalyTypeLabel(
    type: TelemetryAnomalyType
  ): string {
    switch (type) {
      case 'THRESHOLD':
        return 'Dépassement de seuil';
      case 'VARIATION':
        return 'Variation brutale';
      case 'MISSING':
        return 'Données manquantes';
    }
  }

  getSeverityLabel(
    severity: TelemetryAnomalySeverity
  ): string {
    switch (severity) {
      case 'FAIBLE':
        return 'Faible';
      case 'MOYENNE':
        return 'Moyenne';
      case 'ELEVEE':
        return 'Élevée';
    }
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'medium'
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

  trackByAnomalyId(
    index: number,
    anomaly: TelemetryAnomaly
  ): string {
    return anomaly.id;
  }

  private initializeMissionSelection(): void {
    if (this.missions.length === 0) {
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
      this.resetTelemetryContext();

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

    this.loadMetrics();
  }

  private resetTelemetryContext(): void {
    this.availableMetrics = [];
    this.selectedMetrics = [];
    this.telemetryPoints = [];
    this.chartSeries = [];
    this.anomalies = [];
    this.selectedFile = null;
    this.importResult = null;
    this.importErrors = [];
    this.errorMessage = '';
    this.successMessage = '';
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

  private buildChartSeries(
    points: TelemetryPoint[]
  ): TelemetryChartSeries[] {
    if (points.length === 0) {
      return [];
    }

    const timestamps = points.map(
      point => new Date(point.timestamp).getTime()
    );

    const values = points.map(
      point => point.value
    );

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const groupedPoints = new Map<string, TelemetryPoint[]>();

    points.forEach(point => {
      const metricPoints =
        groupedPoints.get(point.metric) ?? [];

      metricPoints.push(point);
      groupedPoints.set(point.metric, metricPoints);
    });

    return Array
      .from(groupedPoints.entries())
      .map(([metric, metricPoints]) => {
        const chartPoints = metricPoints
          .sort(
            (first, second) =>
              new Date(first.timestamp).getTime() -
              new Date(second.timestamp).getTime()
          )
          .map(point => ({
            x: this.scaleValue(
              new Date(point.timestamp).getTime(),
              minTime,
              maxTime,
              this.chartPadding,
              this.chartWidth - this.chartPadding
            ),
            y: this.scaleValue(
              point.value,
              minValue,
              maxValue,
              this.chartHeight - this.chartPadding,
              this.chartPadding
            ),
            timestamp: point.timestamp,
            value: point.value
          }));

        return {
          metric,
          points: chartPoints,
          path: chartPoints
            .map(
              (point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            )
            .join(' ')
        };
      });
  }

  private scaleValue(
    value: number,
    minSource: number,
    maxSource: number,
    minTarget: number,
    maxTarget: number
  ): number {
    if (minSource === maxSource) {
      return (minTarget + maxTarget) / 2;
    }

    return minTarget +
      ((value - minSource) *
        (maxTarget - minTarget)) /
      (maxSource - minSource);
  }

  private toIsoDateOrNull(
    value: string
  ): string | null {
    if (!value) {
      return null;
    }

    return new Date(value).toISOString();
  }

  private isDateRangeValid(
    from: string | null,
    to: string | null
  ): boolean {
    if (
      from &&
      to &&
      new Date(from).getTime() > new Date(to).getTime()
    ) {
      this.errorMessage =
        'La date de début doit précéder la date de fin.';
      return false;
    }

    return true;
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
        'Mission ou satellite introuvable.';
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
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }
}
