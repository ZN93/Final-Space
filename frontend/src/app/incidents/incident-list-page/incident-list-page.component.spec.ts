import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { IncidentListPageComponent } from './incident-list-page.component';

describe('IncidentListPageComponent', () => {

  let component: IncidentListPageComponent;
  let fixture: ComponentFixture<IncidentListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
