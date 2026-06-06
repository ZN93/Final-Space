import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Mission } from '../models/mission.model';
import { MissionService } from '../services/mission.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-detail.component.html',
  styleUrl: './mission-detail.component.css'
})
export class MissionDetailComponent implements OnInit {

  mission: Mission | null = null;

  name = '';
  description = '';

  loading = false;
  saving = false;
  closing = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMission();
  }

  loadMission(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de mission invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.missionService.findById(id).subscribe({
      next: (mission) => {
        this.mission = mission;
        this.name = mission.name;
        this.description = mission.description || '';
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

        this.errorMessage = 'Impossible de charger la mission.';
      }
    });
  }

  updateMission(): void {
    if (!this.mission || !this.canEdit()) {
      return;
    }

    const trimmedName = this.name.trim();

    if (!trimmedName) {
      this.errorMessage = 'Le nom de la mission est obligatoire.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.missionService.update(this.mission.id, {
      name: trimmedName,
      description: this.description.trim()
    }).subscribe({
      next: (updatedMission) => {
        this.mission = updatedMission;
        this.name = updatedMission.name;
        this.description = updatedMission.description || '';
        this.saving = false;
        this.successMessage = 'Mission modifiée avec succès.';
      },
      error: (error) => {
        this.saving = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 400) {
          this.errorMessage = 'Modification refusée : la mission est peut-être clôturée ou les données sont invalides.';
          return;
        }

        this.errorMessage = 'Impossible de modifier la mission.';
      }
    });
  }

  closeMission(): void {
    if (!this.mission || !this.canClose()) {
      return;
    }

    const confirmed = confirm('Confirmer la clôture de cette mission ? Cette action rendra la mission non modifiable.');

    if (!confirmed) {
      return;
    }

    this.closing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.missionService.close(this.mission.id).subscribe({
      next: (closedMission) => {
        this.mission = closedMission;
        this.name = closedMission.name;
        this.description = closedMission.description || '';
        this.closing = false;
        this.successMessage = 'Mission clôturée avec succès.';
      },
      error: (error) => {
        this.closing = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        this.errorMessage = 'Impossible de clôturer la mission.';
      }
    });
  }

  canManage(): boolean {
    return this.authService.isAdmin() || this.authService.isOperateur();
  }

  isClosed(): boolean {
    return this.mission?.status === 'CLOTUREE';
  }

  canEdit(): boolean {
    return this.canManage() && !this.isClosed();
  }

  canClose(): boolean {
    return this.canManage() && !this.isClosed();
  }

  isReadOnly(): boolean {
    return !this.canEdit();
  }
}
