import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Mission } from '../../missions/models/mission.model';
import { Satellite } from '../../satellites/models/satellite.model';
import {
  MissionSatelliteSelectorComponent
} from './mission-satellite-selector.component';

describe('MissionSatelliteSelectorComponent', () => {
  let component: MissionSatelliteSelectorComponent;
  let fixture: ComponentFixture<
    MissionSatelliteSelectorComponent
  >;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MissionSatelliteSelectorComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      MissionSatelliteSelectorComponent
    );

    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected mission', () => {
    spyOn(
      component.selectedMissionIdChange,
      'emit'
    );

    spyOn(
      component.missionChange,
      'emit'
    );

    component.onMissionSelectionChange(12);

    expect(component.selectedMissionId).toBe(12);

    expect(
      component.selectedMissionIdChange.emit
    ).toHaveBeenCalledWith(12);

    expect(
      component.missionChange.emit
    ).toHaveBeenCalled();
  });

  it('should emit a null mission selection', () => {
    spyOn(
      component.selectedMissionIdChange,
      'emit'
    );

    component.onMissionSelectionChange(null);

    expect(component.selectedMissionId).toBeNull();

    expect(
      component.selectedMissionIdChange.emit
    ).toHaveBeenCalledWith(null);
  });

  it('should emit the selected satellite', () => {
    spyOn(
      component.selectedSatelliteIdChange,
      'emit'
    );

    spyOn(
      component.satelliteChange,
      'emit'
    );

    component.onSatelliteSelectionChange(24);

    expect(component.selectedSatelliteId).toBe(24);

    expect(
      component.selectedSatelliteIdChange.emit
    ).toHaveBeenCalledWith(24);

    expect(
      component.satelliteChange.emit
    ).toHaveBeenCalled();
  });

  it('should emit a null satellite selection', () => {
    spyOn(
      component.selectedSatelliteIdChange,
      'emit'
    );

    component.onSatelliteSelectionChange(null);

    expect(component.selectedSatelliteId).toBeNull();

    expect(
      component.selectedSatelliteIdChange.emit
    ).toHaveBeenCalledWith(null);
  });

  it('should track missions by id', () => {
    const mission = {
      id: 7,
      name: 'Mission test'
    } as Mission;

    expect(
      component.trackByMissionId(0, mission)
    ).toBe(7);
  });

  it('should track satellites by id', () => {
    const satellite = {
      id: 9,
      name: 'Satellite test'
    } as Satellite;

    expect(
      component.trackBySatelliteId(0, satellite)
    ).toBe(9);
  });

  it('should display the mission and satellite selectors', () => {
    component.missions = [
      {
        id: 1,
        name: 'Mission Alpha',
        status: 'ACTIVE'
      }
    ] as Mission[];

    component.satellites = [
      {
        id: 2,
        name: 'Satellite Alpha',
        status: 'ACTIF'
      }
    ] as Satellite[];

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('#mission-select')
    ).toBeTruthy();

    expect(
      element.querySelector('#satellite-select')
    ).toBeTruthy();

    expect(element.textContent)
      .toContain('Mission Alpha');

    expect(element.textContent)
      .toContain('Satellite Alpha');
  });
});
