import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Mission } from '../models/mission.model';
import { MissionService } from '../services/mission.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mission-list.component.html',
  styleUrl: './mission-list.component.css'
})
export class MissionListComponent implements OnInit {

  missions: Mission[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private missionService: MissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMissions();
  }

  canCreateMission(): boolean {
    return this.authService.isAdmin() || this.authService.isOperateur();
  }

  loadMissions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.missionService.findAll().subscribe({
      next: (missions) => {
        this.missions = missions;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les missions.';
        this.loading = false;
      }
    });
  }

  isClosed(mission: Mission): boolean {
    return mission.status === 'CLOTUREE';
  }
}
