import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { ReportPageComponent } from './report-page.component';

describe('ReportPageComponent', () => {

  let component: ReportPageComponent;
  let fixture: ComponentFixture<ReportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
