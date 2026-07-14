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
  Alert,
  AlertSeverity,
  AlertStatus
} from '../models/alert.model';
import { AlertService } from '../services/alert.service';

type AlertStatusFilter = 'ALL' | AlertStatus;
type AlertSeverityFilter = 'ALL' | AlertSeverity;

@Component({
  selector: 'app-alert-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './alert-list-page.component.html',
  styleUrl: './alert-list-page.component.css'
})
export class AlertListPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  alerts: Alert[] = [];

  selectedMissionId: number | null = null;

  searchTerm = '';
  statusFilter: AlertStatusFilter = 'ALL';
  severityFilter: AlertSeverityFilter = 'ALL';

  missionsLoading = false;
  alertsLoading = false;

  acknowledgingAlertId: number | null = null;

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

  get filteredAlerts(): Alert[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.alerts.filter(alert => {
      const matchesSearch =
        !normalizedSearch ||
        alert.message.toLowerCase().includes(normalizedSearch) ||
        alert.metric.toLowerCase().includes(normalizedSearch) ||
        alert.type.toLowerCase().includes(normalizedSearch) ||
        (alert.satelliteName ?? '')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        alert.status === this.statusFilter;

      const matchesSeverity =
        this.severityFilter === 'ALL' ||
        alert.severity === this.severityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity
      );
    });
  }

  get activeAlertCount(): number {
    return this.alerts.filter(
      alert => alert.status === 'ACTIVE'
    ).length;
  }

  get acknowledgedAlertCount(): number {
    return this.alerts.filter(
      alert => alert.status === 'ACQUITTEE'
    ).length;
  }

  get highSeverityAlertCount(): number {
    return this.alerts.filter(
      alert => alert.severity === 'ELEVEE'
    ).length;
  }

  get canManage(): boolean {
    return (
      this.authService.isAdmin() ||
      this.authService.isOperateur()
    );
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
    this.alerts = [];
    this.errorMessage = '';
    this.successMessage = '';

    this.updateMissionQueryParam(
      this.selectedMissionId
    );

    if (this.selectedMissionId) {
      this.loadAlerts(this.selectedMissionId);
    }
  }

  loadAlerts(missionId: number): void {
    this.alertsLoading = true;
    this.errorMessage = '';

    this.alertService
      .findByMission(missionId, 'ALL')
      .subscribe({
        next: alerts => {
          this.alerts = [...alerts].sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
          );

          this.alertsLoading = false;
        },
        error: error => {
          this.alertsLoading = false;

          if (error.status === 403) {
            this.router.navigate(['/forbidden']);
            return;
          }

          if (error.status === 404) {
            this.errorMessage = 'Mission introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger les alertes.';
        }
      });
  }

  refresh(): void {
    if (this.selectedMissionId) {
      this.loadAlerts(this.selectedMissionId);
      return;
    }

    this.loadMissions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.severityFilter = 'ALL';
  }

  canAcknowledge(alert: Alert): boolean {
    return (
      this.canManage &&
      alert.status === 'ACTIVE'
    );
  }

  acknowledgeAlert(alert: Alert): void {
    if (!this.canAcknowledge(alert)) {
      return;
    }

    const confirmed = window.confirm(
      `Confirmer l’acquittement de l’alerte #${alert.id} ?`
    );

    if (!confirmed) {
      return;
    }

    this.acknowledgingAlertId = alert.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.alertService.acknowledge(alert.id).subscribe({
      next: updatedAlert => {
        this.alerts = this.alerts.map(currentAlert =>
          currentAlert.id === updatedAlert.id
            ? updatedAlert
            : currentAlert
        );

        this.acknowledgingAlertId = null;
        this.successMessage =
          `L’alerte #${updatedAlert.id} a été acquittée.`;
      },
      error: error => {
        this.acknowledgingAlertId = null;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Alerte introuvable.';
          return;
        }

        if (
          error.status === 400 ||
          error.status === 409
        ) {
          this.errorMessage =
            'Cette alerte est déjà acquittée.';
          return;
        }

        this.errorMessage =
          'Impossible d’acquitter cette alerte.';
      }
    });
  }

  getSeverityLabel(
    severity: AlertSeverity
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

  getStatusLabel(
    status: AlertStatus
  ): string {
    return status === 'ACTIVE'
      ? 'Active'
      : 'Acquittée';
  }

  formatDate(
    value: string | null | undefined
  ): string {
    if (!value) {
      return 'Non renseignée';
    }

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

  trackByAlertId(
    index: number,
    alert: Alert
  ): number {
    return alert.id;
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

    this.updateMissionQueryParam(
      defaultMission.id
    );

    this.loadAlerts(defaultMission.id);
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
}
