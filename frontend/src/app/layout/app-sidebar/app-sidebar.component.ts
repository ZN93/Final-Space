import { Component, Input } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavigationItem {
  label: string;
  description: string;
  route: string;
  icon: string;
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

  @Input()
  collapsed = false;

  readonly items: NavigationItem[] = [
    {
      label: 'Vue générale',
      description: 'Synthèse opérationnelle',
      route: '/dashboard',
      icon: '⌂'
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
      label: 'Télémétrie',
      description: 'Mesures et anomalies',
      route: '/telemetry',
      icon: 'T'
    },
    {
      label: 'Alertes',
      description: 'Alertes opérationnelles',
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
    }
  ];
}
