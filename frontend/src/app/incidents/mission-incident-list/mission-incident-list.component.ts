import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Incident, IncidentSeverity, IncidentStatus } from '../models/incident.model';
import { IncidentService } from '../services/incident.service';
import { MissionService } from '../../missions/services/mission.service';

type IncidentFilter = IncidentStatus | 'ALL';

@Component({
  selector: 'app-mission-incident-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-incident-list.component.html',
  styleUrl: './mission-incident-list.component.css'
})
export class MissionIncidentListComponent implements OnInit {

  missionId!: number;
  incidents: Incident[] = [];

  selectedStatus: IncidentFilter = 'ALL';

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  showCreateForm = false;

  title = '';
  description = '';
  notes = '';
  severity: IncidentSeverity = 'MOYENNE';

  missionStatus: 'ACTIVE' | 'CLOTUREE' | null = null;

  editingIncident: Incident | null = null;
  processingIncidentId: number | null = null;

  editTitle = '';
  editDescription = '';
  editNotes = '';
  editSeverity: IncidentSeverity = 'MOYENNE';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incidentService: IncidentService,
    private missionService: MissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de mission invalide.';
      return;
    }

    this.missionId = id;
    this.loadIncidents();
    this.loadMission();
  }

  loadIncidents(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService.findByMission(this.missionId, this.selectedStatus).subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.loading = false;
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

        this.errorMessage = 'Impossible de charger les incidents de la mission.';
      }
    });
  }

  loadMission(): void {
    this.missionService.findById(this.missionId).subscribe({
      next: (mission) => {
        this.missionStatus = mission.status;
      },
      error: (error) => {
        if (error.status === 404) {
          this.errorMessage = 'Mission introuvable.';
          return;
        }

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage = 'Impossible de charger les informations de la mission.';
      }
    });
  }

  canCreateIncident(): boolean {
    return this.canManage() && this.missionStatus === 'ACTIVE';
  }

  isMissionClosed(): boolean {
    return this.missionStatus === 'CLOTUREE';
  }

  canEditIncident(incident: Incident): boolean {
    return this.canManage()
      && this.missionStatus === 'ACTIVE'
      && incident.status !== 'CLOTURE';
  }

  canMoveToInProgress(incident: Incident): boolean {
    return this.canManage()
      && this.missionStatus === 'ACTIVE'
      && incident.status === 'OUVERT';
  }

  canCloseIncident(incident: Incident): boolean {
    return this.canManage()
      && this.missionStatus === 'ACTIVE'
      && incident.status !== 'CLOTURE';
  }

  startEditIncident(incident: Incident): void {
    if (!this.canEditIncident(incident)) {
      return;
    }

    this.editingIncident = incident;
    this.editTitle = incident.title;
    this.editDescription = incident.description || '';
    this.editNotes = incident.notes || '';
    this.editSeverity = incident.severity;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditIncident(): void {
    this.editingIncident = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editNotes = '';
    this.editSeverity = 'MOYENNE';
  }

  updateIncident(): void {
    if (!this.editingIncident) {
      return;
    }

    const trimmedTitle = this.editTitle.trim();

    if (!trimmedTitle) {
      this.errorMessage = 'Le titre de l’incident est obligatoire.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService.update(this.editingIncident.id, {
      title: trimmedTitle,
      description: this.editDescription || null,
      notes: this.editNotes || null,
      severity: this.editSeverity
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Incident modifié avec succès.';
        this.cancelEditIncident();
        this.loadIncidents();
      },
      error: (error) => {
        this.saving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400 || error.status === 409) {
          this.errorMessage = 'Modification refusée : l’incident est peut-être clôturé ou les données sont invalides.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Incident introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de modifier l’incident.';
      }
    });
  }

  moveToInProgress(incident: Incident): void {
    if (!this.canMoveToInProgress(incident)) {
      return;
    }

    this.processingIncidentId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService.updateStatus(incident.id, 'EN_COURS').subscribe({
      next: () => {
        this.processingIncidentId = null;
        this.successMessage = 'Incident passé en cours.';
        this.loadIncidents();
      },
      error: (error) => {
        this.processingIncidentId = null;
        this.handleIncidentActionError(error);
      }
    });
  }

  closeIncident(incident: Incident): void {
    if (!this.canCloseIncident(incident)) {
      return;
    }

    const confirmed = confirm('Confirmer la clôture de cet incident ?');

    if (!confirmed) {
      return;
    }

    this.processingIncidentId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService.close(incident.id).subscribe({
      next: () => {
        this.processingIncidentId = null;
        this.successMessage = 'Incident clôturé avec succès.';
        this.cancelEditIncident();
        this.loadIncidents();
      },
      error: (error) => {
        this.processingIncidentId = null;
        this.handleIncidentActionError(error);
      }
    });
  }

  private handleIncidentActionError(error: any): void {
    if (error.status === 403) {
      this.router.navigate(['/forbidden']);
      return;
    }

    if (error.status === 404) {
      this.errorMessage = 'Incident introuvable.';
      return;
    }

    if (error.status === 400 || error.status === 409) {
      this.errorMessage = 'Action refusée : l’incident est clôturé ou la transition est invalide.';
      return;
    }

    this.errorMessage = 'Impossible d’effectuer l’action sur l’incident.';
  }

  onStatusChange(): void {
    this.loadIncidents();
  }

  refresh(): void {
    this.loadIncidents();
  }

  canManage(): boolean {
    const role = this.authService.getUserRole();
    return role === 'ADMIN' || role === 'OPERATEUR';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    this.successMessage = '';
  }

  createIncident(): void {
    const trimmedTitle = this.title.trim();

    if (!trimmedTitle) {
      this.errorMessage = 'Le titre de l’incident est obligatoire.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService.create(this.missionId, {
      satelliteId: null,
      alertId: null,
      title: trimmedTitle,
      description: this.description || null,
      notes: this.notes || null,
      severity: this.severity
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showCreateForm = false;
        this.title = '';
        this.description = '';
        this.notes = '';
        this.severity = 'MOYENNE';
        this.successMessage = 'Incident créé avec succès.';
        this.loadIncidents();
      },
      error: (error) => {
        this.saving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.errorMessage = 'Création refusée : la mission est peut-être clôturée ou les données sont invalides.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Mission introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de créer l’incident.';
      }
    });
  }

  isClosed(incident: Incident): boolean {
    return incident.status === 'CLOTURE';
  }
}
