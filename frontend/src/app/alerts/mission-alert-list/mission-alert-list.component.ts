import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Alert, AlertStatus } from '../models/alert.model';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../../auth/auth.service';

type AlertFilter = AlertStatus | 'ALL';

@Component({
  selector: 'app-mission-alert-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-alert-list.component.html',
  styleUrl: './mission-alert-list.component.css'
})
export class MissionAlertListComponent implements OnInit {

  missionId!: number;
  alerts: Alert[] = [];

  selectedStatus: AlertFilter = 'ALL';

  loading = false;
  errorMessage = '';

  acknowledgingAlertId: number | null = null;
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de mission invalide.';
      return;
    }

    this.missionId = id;
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.successMessage = '';

    this.alertService.findByMission(this.missionId, this.selectedStatus).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
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

        this.errorMessage = 'Impossible de charger les alertes de la mission.';
      }
    });
  }

  onStatusChange(): void {
    this.loadAlerts();
  }

  refresh(): void {
    this.loadAlerts();
  }

  isActive(alert: Alert): boolean {
    return alert.status === 'ACTIVE';
  }

  isAcknowledged(alert: Alert): boolean {
    return alert.status === 'ACQUITTEE';
  }

  canAcknowledge(alert: Alert): boolean {
    const role = this.authService.getUserRole();

    return alert.status === 'ACTIVE'
      && (role === 'ADMIN' || role === 'OPERATEUR');
  }

  acknowledgeAlert(alert: Alert): void {
    if (!this.canAcknowledge(alert)) {
      return;
    }

    const confirmed = confirm('Confirmer l’acquittement de cette alerte ?');

    if (!confirmed) {
      return;
    }

    this.acknowledgingAlertId = alert.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.alertService.acknowledge(alert.id).subscribe({
      next: () => {
        this.acknowledgingAlertId = null;
        this.successMessage = 'Alerte acquittée avec succès.';
        this.loadAlerts();
      },
      error: (error) => {
        this.acknowledgingAlertId = null;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Alerte introuvable.';
          return;
        }

        if (error.status === 400 || error.status === 409) {
          this.errorMessage = 'Cette alerte est déjà acquittée.';
          return;
        }

        this.errorMessage = 'Impossible d’acquitter cette alerte.';
      }
    });
  }
}
