import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentListPageComponent } from './incident-list-page.component';

describe('IncidentListPageComponent', () => {
  let component: IncidentListPageComponent;
  let fixture: ComponentFixture<IncidentListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
