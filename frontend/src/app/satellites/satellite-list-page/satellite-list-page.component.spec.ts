import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { SatelliteListPageComponent } from './satellite-list-page.component';

describe('SatelliteListPageComponent', () => {

  let component: SatelliteListPageComponent;
  let fixture: ComponentFixture<SatelliteListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SatelliteListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SatelliteListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
