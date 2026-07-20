import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';

@Component({
  selector: 'app-mission-satellite-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl:
    './mission-satellite-selector.component.html',
  styleUrl:
    './mission-satellite-selector.component.css'
})
export class MissionSatelliteSelectorComponent {
  @Input() missions: Mission[] = [];
  @Input() satellites: Satellite[] = [];

  @Input() selectedMissionId: number | null = null;
  @Input() selectedSatelliteId: number | null = null;

  @Input() missionsLoading = false;
  @Input() satellitesLoading = false;

  @Output() selectedMissionIdChange =
    new EventEmitter<number | null>();

  @Output() selectedSatelliteIdChange =
    new EventEmitter<number | null>();

  @Output() missionChange = new EventEmitter<void>();
  @Output() satelliteChange = new EventEmitter<void>();

  onMissionSelectionChange(
    missionId: number | null
  ): void {
    this.selectedMissionId = missionId;
    this.selectedMissionIdChange.emit(missionId);
    this.missionChange.emit();
  }

  onSatelliteSelectionChange(
    satelliteId: number | null
  ): void {
    this.selectedSatelliteId = satelliteId;
    this.selectedSatelliteIdChange.emit(satelliteId);
    this.satelliteChange.emit();
  }

  trackByMissionId(
    index: number,
    mission: Mission
  ): number {
    return mission.id;
  }

  trackBySatelliteId(
    index: number,
    satellite: Satellite
  ): number {
    return satellite.id;
  }
}
