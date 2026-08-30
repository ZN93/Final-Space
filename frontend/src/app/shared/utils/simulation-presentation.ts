import {
  SimulationListItemResponse
} from '../../simulations/models/simulation.model';
import {
  MissionSatelliteContextPage
} from '../services/mission-satellite-context-page';

export function formatSimulationSummary(
  simulation: SimulationListItemResponse
): string {
  if (simulation.type === 'HOHMANN') {
    const deltaV =
      simulation.deltaVTotalMS === null
        ? 'Non disponible'
        : `${simulation.deltaVTotalMS.toLocaleString('fr-FR')} m/s`;

    const duration =
      simulation.transferTimeMinutes === null
        ? 'Non disponible'
        : `${simulation.transferTimeMinutes.toLocaleString('fr-FR')} min`;

    return `Δv total : ${deltaV} · Durée : ${duration}`;
  }

  const period =
    simulation.orbitalPeriodMinutes === null
      ? 'Non disponible'
      : `${simulation.orbitalPeriodMinutes.toLocaleString('fr-FR')} min`;

  const velocity =
    simulation.averageVelocityKmS === null
      ? 'Non disponible'
      : `${simulation.averageVelocityKmS.toLocaleString('fr-FR')} km/s`;

  return `Période : ${period} · Vitesse : ${velocity}`;
}

export function formatShortDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function trackByNumericId(
  _index: number,
  item: { id: number }
): number {
  return item.id;
}

export abstract class SimulationPresentationPage
  extends MissionSatelliteContextPage {

  readonly getSimulationSummary = formatSimulationSummary;
  readonly formatDate = formatShortDateTime;
  readonly trackByMissionId = trackByNumericId;
  readonly trackBySatelliteId = trackByNumericId;
  readonly trackBySimulationId = trackByNumericId;
}
