import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { TelemetryPageComponent } from './telemetry-page.component';

describe('TelemetryPageComponent', () => {

  let component: TelemetryPageComponent;
  let fixture: ComponentFixture<TelemetryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
