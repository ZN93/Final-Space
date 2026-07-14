import { NavigationItem } from '../models/navigation-item.model';

export const NAVIGATION_ITEMS: ReadonlyArray<NavigationItem> = [
  {
    label: 'Vue générale',
    description: 'Synthèse opérationnelle',
    route: '/dashboard',
    icon: '⌂',
    exact: true
  },
  {
    label: 'Missions',
    description: 'Créer, consulter et superviser les missions spatiales.',
    route: '/missions',
    icon: 'M'
  },
  {
    label: 'Satellites',
    description: 'Consulter et gérer les satellites rattachés aux missions.',
    route: '/satellites',
    icon: 'S'
  },
  {
    label: 'Simulations',
    description: 'Consulter les simulations orbitales et les transferts de Hohmann.',
    route: '/simulations',
    icon: 'SIM'
  },
  {
    label: 'Télémétrie',
    description: 'Importer, visualiser et analyser les données de télémétrie.',
    route: '/telemetry',
    icon: 'T'
  },
  {
    label: 'Alertes',
    description: 'Consulter et acquitter les alertes opérationnelles.',
    route: '/alerts',
    icon: 'A'
  },
  {
    label: 'Incidents',
    description: 'Créer, suivre et clôturer les incidents de mission.',
    route: '/incidents',
    icon: 'I'
  },
  {
    label: 'Rapports',
    description: 'Générer les rapports de mission, simulation et télémétrie.',
    route: '/reports',
    icon: 'R'
  },
  {
    label: 'Utilisateurs',
    description: 'Administrer les comptes et leurs rôles.',
    route: '/admin/users',
    icon: 'U',
    adminOnly: true
  }
];
