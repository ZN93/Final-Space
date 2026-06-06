import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MissionDashboard } from '../models/mission-dashboard.model';
import { MissionDashboardService } from '../services/mission-dashboard.service';

@Component({
  selector: 'app-mission-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mission-dashboard-page.component.html',
  styleUrl: './mission-dashboard-page.component.css'
})
export class MissionDashboardPageComponent implements OnInit {

  dashboard: MissionDashboard | null = null;

  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionDashboardService: MissionDashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const missionId = Number(this.route.snapshot.paramMap.get('id'));

    if (!missionId) {
      this.errorMessage = 'Identifiant de mission invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.missionDashboardService.getMissionDashboard(missionId).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
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

        this.errorMessage = 'Impossible de charger le dashboard de mission.';
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  isMissionClosed(): boolean {
    return this.dashboard?.missionStatus === 'CLOTUREE';
  }

  hasNoActivity(): boolean {
    return !!this.dashboard
      && this.dashboard.lastSimulations.length === 0
      && this.dashboard.lastTelemetryImports.length === 0;
  }
}
