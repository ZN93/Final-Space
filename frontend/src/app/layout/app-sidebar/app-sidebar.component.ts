import { Component, inject, Input } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface NavigationItem {
  label: string;
  description: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css'
})
export class AppSidebarComponent {

  private readonly authService = inject(AuthService);

  @Input()
  collapsed = false;

  readonly items: NavigationItem[] = [
    {
      label: 'Vue g\u00e9n\u00e9rale',
      description: 'Synth\u00e8se op\u00e9rationnelle',
      route: '/dashboard',
      icon: '\u2302'
    },
    {
      label: 'Missions',
      description: 'Suivi des missions',
      route: '/missions',
      icon: 'M'
    },
    {
      label: 'Satellites',
      description: 'Parc satellitaire',
      route: '/satellites',
      icon: 'S'
    },
    {
      label: 'Simulations',
      description: 'Calculs orbitaux',
      route: '/simulations',
      icon: 'SIM'
    },
    {
      label: 'T\u00e9l\u00e9m\u00e9trie',
      description: 'Mesures et anomalies',
      route: '/telemetry',
      icon: 'T'
    },
    {
      label: 'Alertes',
      description: 'Alertes op\u00e9rationnelles',
      route: '/alerts',
      icon: 'A'
    },
    {
      label: 'Incidents',
      description: 'Suivi des incidents',
      route: '/incidents',
      icon: 'I'
    },
    {
      label: 'Rapports',
      description: 'Exports et rapports',
      route: '/reports',
      icon: 'R'
    },
    {
      label: 'Utilisateurs',
      description: 'Administration des comptes',
      route: '/admin/users',
      icon: 'U',
      adminOnly: true
    }
  ];

  get visibleItems(): NavigationItem[] {
    return this.items.filter(
      item => !item.adminOnly || this.authService.isAdmin()
    );
  }
}
