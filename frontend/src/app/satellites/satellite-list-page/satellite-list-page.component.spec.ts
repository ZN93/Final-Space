import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SatelliteListPageComponent } from './satellite-list-page.component';

describe('SatelliteListPageComponent', () => {
  let component: SatelliteListPageComponent;
  let fixture: ComponentFixture<SatelliteListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SatelliteListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SatelliteListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
