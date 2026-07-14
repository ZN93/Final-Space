import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { SimulationListPageComponent } from './simulation-list-page.component';

describe('SimulationListPageComponent', () => {

  let component: SimulationListPageComponent;
  let fixture: ComponentFixture<SimulationListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
