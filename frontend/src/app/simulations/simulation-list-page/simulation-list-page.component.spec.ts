import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationListPageComponent } from './simulation-list-page.component';

describe('SimulationListPageComponent', () => {
  let component: SimulationListPageComponent;
  let fixture: ComponentFixture<SimulationListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulationListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
