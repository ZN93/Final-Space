import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../services/mission.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mission-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-form.component.html',
  styleUrl: './mission-form.component.css'
})
export class MissionFormComponent implements OnInit {

  name = '';
  description = '';

  loading = false;
  errorMessage = '';

  constructor(
    private missionService: MissionService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLecteur()) {
      this.router.navigate(['/forbidden']);
    }
  }

  createMission(): void {
    this.errorMessage = '';

    const trimmedName = this.name.trim();

    if (!trimmedName) {
      this.errorMessage = 'Le nom de la mission est obligatoire.';
      return;
    }

    this.loading = true;

    this.missionService.create({
      name: trimmedName,
      description: this.description.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/missions']);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 403) {
          this.errorMessage = 'Accès interdit : vous ne pouvez pas créer de mission.';
          return;
        }

        if (error.status === 400) {
          this.errorMessage = 'Les données saisies sont invalides.';
          return;
        }

        this.errorMessage = 'Impossible de créer la mission.';
      }
    });
  }
}
