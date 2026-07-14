import { NavigationItem } from '../models/navigation-item.model';

function navigationItem(
  label: string,
  description: string,
  route: string,
  icon: string,
  options: Pick<NavigationItem, 'exact' | 'adminOnly'> = {}
): NavigationItem {
  return {
    label,
    description,
    route,
    icon,
    ...options
  };
}

export const NAVIGATION_ITEMS: ReadonlyArray<NavigationItem> = [
  navigationItem(
    'Vue générale',
    'Synthèse opérationnelle',
    '/dashboard',
    '⌂',
    { exact: true }
  ),
  navigationItem(
    'Missions',
    'Créer, consulter et superviser les missions spatiales.',
    '/missions',
    'M'
  ),
  navigationItem(
    'Satellites',
    'Consulter et gérer les satellites rattachés aux missions.',
    '/satellites',
    'S'
  ),
  navigationItem(
    'Simulations',
    'Consulter les simulations orbitales et les transferts de Hohmann.',
    '/simulations',
    'SIM'
  ),
  navigationItem(
    'Télémétrie',
    'Importer, visualiser et analyser les données de télémétrie.',
    '/telemetry',
    'T'
  ),
  navigationItem(
    'Alertes',
    'Consulter et acquitter les alertes opérationnelles.',
    '/alerts',
    'A'
  ),
  navigationItem(
    'Incidents',
    'Créer, suivre et clôturer les incidents de mission.',
    '/incidents',
    'I'
  ),
  navigationItem(
    'Rapports',
    'Générer les rapports de mission, simulation et télémétrie.',
    '/reports',
    'R'
  ),
  navigationItem(
    'Utilisateurs',
    'Administrer les comptes et leurs rôles.',
    '/admin/users',
    'U',
    { adminOnly: true }
  )
];
