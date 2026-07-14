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
  Incident,
  IncidentCreateRequest,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdateRequest
} from '../models/incident.model';
import { IncidentService } from '../services/incident.service';

type IncidentStatusFilter = 'ALL' | IncidentStatus;
type IncidentSeverityFilter = 'ALL' | IncidentSeverity;

@Component({
  selector: 'app-incident-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './incident-list-page.component.html',
  styleUrl: './incident-list-page.component.css'
})
export class IncidentListPageComponent implements OnInit {

  private readonly missionService = inject(MissionService);
  private readonly satelliteService = inject(SatelliteService);
  private readonly incidentService = inject(IncidentService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  missions: Mission[] = [];
  satellites: Satellite[] = [];
  incidents: Incident[] = [];

  selectedMissionId: number | null = null;

  searchTerm = '';
  statusFilter: IncidentStatusFilter = 'ALL';
  severityFilter: IncidentSeverityFilter = 'ALL';

  missionsLoading = false;
  satellitesLoading = false;
  incidentsLoading = false;
  saving = false;

  processingIncidentId: number | null = null;

  errorMessage = '';
  successMessage = '';

  creationPanelOpen = false;
  editingIncident: Incident | null = null;

  createTitle = '';
  createDescription = '';
  createNotes = '';
  createSeverity: IncidentSeverity = 'MOYENNE';
  createSatelliteId: number | null = null;

  editTitle = '';
  editDescription = '';
  editNotes = '';
  editSeverity: IncidentSeverity = 'MOYENNE';

  ngOnInit(): void {
    this.loadMissions();
  }

  get selectedMission(): Mission | null {
    return this.missions.find(
      mission => mission.id === this.selectedMissionId
    ) ?? null;
  }

  get filteredIncidents(): Incident[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.incidents.filter(incident => {
      const matchesSearch =
        !normalizedSearch ||
        incident.title.toLowerCase().includes(normalizedSearch) ||
        (incident.description ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        (incident.notes ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        (incident.satelliteName ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        incident.createdBy
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        incident.status === this.statusFilter;

      const matchesSeverity =
        this.severityFilter === 'ALL' ||
        incident.severity === this.severityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity
      );
    });
  }

  get openIncidentCount(): number {
    return this.incidents.filter(
      incident => incident.status === 'OUVERT'
    ).length;
  }

  get inProgressIncidentCount(): number {
    return this.incidents.filter(
      incident => incident.status === 'EN_COURS'
    ).length;
  }

  get closedIncidentCount(): number {
    return this.incidents.filter(
      incident => incident.status === 'CLOTURE'
    ).length;
  }

  get highSeverityIncidentCount(): number {
    return this.incidents.filter(
      incident => incident.severity === 'ELEVEE'
    ).length;
  }

  get canManage(): boolean {
    return (
      this.authService.isAdmin() ||
      this.authService.isOperateur()
    );
  }

  get canCreateIncident(): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE'
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
        this.handleError(
          error,
          'Impossible de charger les missions.'
        );
      }
    });
  }

  onMissionChange(): void {
    this.incidents = [];
    this.satellites = [];
    this.closeCreationPanel();
    this.cancelEditIncident();

    this.errorMessage = '';
    this.successMessage = '';

    this.updateMissionQueryParam(
      this.selectedMissionId
    );

    if (!this.selectedMissionId) {
      return;
    }

    this.loadMissionContent(
      this.selectedMissionId
    );
  }

  private loadMissionContent(
    missionId: number
  ): void {
    this.loadIncidents(missionId);
    this.loadSatellites(missionId);
  }

  loadIncidents(missionId: number): void {
    this.incidentsLoading = true;
    this.errorMessage = '';

    this.incidentService
      .findByMission(missionId, 'ALL')
      .subscribe({
        next: incidents => {
          this.incidents = [...incidents].sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
          );

          this.incidentsLoading = false;
        },
        error: error => {
          this.incidentsLoading = false;

          this.handleError(
            error,
            'Impossible de charger les incidents.'
          );
        }
      });
  }

  loadSatellites(missionId: number): void {
    this.satellitesLoading = true;

    this.satelliteService
      .findByMission(missionId)
      .subscribe({
        next: satellites => {
          this.satellites = [...satellites].sort(
            (first, second) =>
              first.name.localeCompare(second.name)
          );

          this.satellitesLoading = false;
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

  refresh(): void {
    if (this.selectedMissionId) {
      this.loadMissionContent(
        this.selectedMissionId
      );

      return;
    }

    this.loadMissions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.severityFilter = 'ALL';
  }

  openCreationPanel(): void {
    if (!this.canCreateIncident) {
      return;
    }

    this.cancelEditIncident();
    this.resetCreateForm();

    this.errorMessage = '';
    this.successMessage = '';
    this.creationPanelOpen = true;
  }

  closeCreationPanel(): void {
    if (this.saving) {
      return;
    }

    this.creationPanelOpen = false;
    this.resetCreateForm();
  }

  createIncident(): void {
    if (
      !this.selectedMissionId ||
      !this.canCreateIncident
    ) {
      return;
    }

    const trimmedTitle = this.createTitle.trim();

    if (!trimmedTitle) {
      this.errorMessage =
        'Le titre de l’incident est obligatoire.';
      return;
    }

    const request: IncidentCreateRequest = {
      satelliteId: this.createSatelliteId,
      alertId: null,
      title: trimmedTitle,
      description:
        this.createDescription.trim() || null,
      notes:
        this.createNotes.trim() || null,
      severity: this.createSeverity
    };

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService
      .create(this.selectedMissionId, request)
      .subscribe({
        next: createdIncident => {
          this.incidents = [
            createdIncident,
            ...this.incidents
          ];

          this.saving = false;
          this.creationPanelOpen = false;
          this.resetCreateForm();

          this.successMessage =
            `L’incident #${createdIncident.id} a été créé.`;
        },
        error: error => {
          this.saving = false;

          this.handleError(
            error,
            'Impossible de créer l’incident.'
          );
        }
      });
  }

  canEditIncident(
    incident: Incident
  ): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE' &&
      incident.status !== 'CLOTURE'
    );
  }

  canMoveToInProgress(
    incident: Incident
  ): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE' &&
      incident.status === 'OUVERT'
    );
  }

  canCloseIncident(
    incident: Incident
  ): boolean {
    return (
      this.canManage &&
      this.selectedMission?.status === 'ACTIVE' &&
      incident.status !== 'CLOTURE'
    );
  }

  startEditIncident(
    incident: Incident
  ): void {
    if (!this.canEditIncident(incident)) {
      return;
    }

    this.closeCreationPanel();

    this.editingIncident = incident;
    this.editTitle = incident.title;
    this.editDescription =
      incident.description ?? '';
    this.editNotes =
      incident.notes ?? '';
    this.editSeverity =
      incident.severity;

    this.errorMessage = '';
    this.successMessage = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelEditIncident(): void {
    if (this.saving) {
      return;
    }

    this.editingIncident = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editNotes = '';
    this.editSeverity = 'MOYENNE';
  }

  updateIncident(): void {
    if (
      !this.editingIncident ||
      !this.canEditIncident(this.editingIncident)
    ) {
      return;
    }

    const trimmedTitle = this.editTitle.trim();

    if (!trimmedTitle) {
      this.errorMessage =
        'Le titre de l’incident est obligatoire.';
      return;
    }

    const request: IncidentUpdateRequest = {
      title: trimmedTitle,
      description:
        this.editDescription.trim() || null,
      notes:
        this.editNotes.trim() || null,
      severity: this.editSeverity
    };

    const incidentId = this.editingIncident.id;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService
      .update(incidentId, request)
      .subscribe({
        next: updatedIncident => {
          this.incidents = this.incidents.map(
            incident =>
              incident.id === updatedIncident.id
                ? updatedIncident
                : incident
          );

          this.saving = false;
          this.cancelEditIncident();

          this.successMessage =
            `L’incident #${updatedIncident.id} a été modifié.`;
        },
        error: error => {
          this.saving = false;

          this.handleError(
            error,
            'Impossible de modifier l’incident.'
          );
        }
      });
  }

  moveToInProgress(
    incident: Incident
  ): void {
    if (!this.canMoveToInProgress(incident)) {
      return;
    }

    this.processingIncidentId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService
      .updateStatus(incident.id, 'EN_COURS')
      .subscribe({
        next: updatedIncident => {
          this.replaceIncident(updatedIncident);

          this.processingIncidentId = null;
          this.successMessage =
            `L’incident #${updatedIncident.id} est maintenant en cours.`;
        },
        error: error => {
          this.processingIncidentId = null;

          this.handleError(
            error,
            'Impossible de changer le statut de l’incident.'
          );
        }
      });
  }

  closeIncident(
    incident: Incident
  ): void {
    if (!this.canCloseIncident(incident)) {
      return;
    }

    const confirmed = window.confirm(
      `Confirmer la clôture de l’incident #${incident.id} ?`
    );

    if (!confirmed) {
      return;
    }

    this.processingIncidentId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService
      .close(incident.id)
      .subscribe({
        next: updatedIncident => {
          this.replaceIncident(updatedIncident);

          if (
            this.editingIncident?.id ===
            updatedIncident.id
          ) {
            this.cancelEditIncident();
          }

          this.processingIncidentId = null;
          this.successMessage =
            `L’incident #${updatedIncident.id} a été clôturé.`;
        },
        error: error => {
          this.processingIncidentId = null;

          this.handleError(
            error,
            'Impossible de clôturer l’incident.'
          );
        }
      });
  }

  getStatusLabel(
    status: IncidentStatus
  ): string {
    switch (status) {
      case 'OUVERT':
        return 'Ouvert';
      case 'EN_COURS':
        return 'En cours';
      case 'CLOTURE':
        return 'Clôturé';
    }
  }

  getSeverityLabel(
    severity: IncidentSeverity
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

  trackBySatelliteId(
    index: number,
    satellite: Satellite
  ): number {
    return satellite.id;
  }

  trackByIncidentId(
    index: number,
    incident: Incident
  ): number {
    return incident.id;
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

    this.updateMissionQueryParam(
      defaultMission.id
    );

    this.loadMissionContent(
      defaultMission.id
    );
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

  private replaceIncident(
    updatedIncident: Incident
  ): void {
    this.incidents = this.incidents.map(
      incident =>
        incident.id === updatedIncident.id
          ? updatedIncident
          : incident
    );
  }

  private resetCreateForm(): void {
    this.createTitle = '';
    this.createDescription = '';
    this.createNotes = '';
    this.createSeverity = 'MOYENNE';
    this.createSatelliteId = null;
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
        'Mission, satellite ou incident introuvable.';
      return;
    }

    if (
      error.status === 400 ||
      error.status === 409
    ) {
      this.errorMessage =
        typeof error.error === 'string'
          ? error.error
          : 'Action refusée : la mission ou l’incident ne permet pas cette opération.';
      return;
    }

    this.errorMessage = fallbackMessage;
  }
}
