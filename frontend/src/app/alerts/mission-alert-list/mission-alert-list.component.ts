import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Alert, AlertStatus } from '../models/alert.model';
import { AlertService } from '../services/alert.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService
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
}
