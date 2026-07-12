import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface DashboardModule {
  title: string;
  description: string;
  route?: string;
  actionLabel?: string;
  icon: string;
  available: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private readonly authService = inject(AuthService);

  readonly role = this.authService.getUserRole();

  readonly modules: DashboardModule[] = [
    {
      title: 'Missions',
      description: 'Créer, consulter et superviser les missions spatiales.',
      route: '/missions',
      actionLabel: 'Accéder aux missions',
      icon: 'M',
      available: true
    },
    {
      title: 'Satellites',
      description: 'Consulter et gérer les satellites rattachés aux missions.',
      route: '/satellites',
      actionLabel: 'Accéder aux satellites',
      icon: 'S',
      available: true
    },
    {
      title: 'Simulations',
      description: 'Consulter les simulations orbitales et les transferts de Hohmann.',
      route: '/simulations',
      actionLabel: 'Accéder aux simulations',
      icon: 'SIM',
      available: true
    },
    {
      title: 'Télémétrie',
      description: 'Importer, visualiser et analyser les données de télémétrie.',
      route: '/telemetry',
      actionLabel: 'Accéder à la télémétrie',
      icon: 'T',
      available: true
    },
    {
      title: 'Alertes',
      description: 'Consulter et acquitter les alertes opérationnelles.',
      route: '/alerts',
      actionLabel: 'Accéder aux alertes',
      icon: 'A',
      available: true
    },
    {
      title: 'Incidents',
      description: 'Créer, suivre et clôturer les incidents de mission.',
      route: '/incidents',
      actionLabel: 'Accéder aux incidents',
      icon: 'I',
      available: true
    },
    {
      title: 'Rapports',
      description: 'Générer les rapports mission, simulation et télémétrie.',
      route: '/reports',
      actionLabel: 'Accéder aux rapports',
      icon: 'R',
      available: true
    }
  ];

  get roleLabel(): string {
    switch (this.role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'OPERATEUR':
        return 'Opérateur';
      case 'LECTEUR':
        return 'Lecteur';
      default:
        return 'Utilisateur';
    }
  }

  get canManage(): boolean {
    return this.role === 'ADMIN' || this.role === 'OPERATEUR';
  }
}
