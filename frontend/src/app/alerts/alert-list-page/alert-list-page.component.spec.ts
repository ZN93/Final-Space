import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { AlertListPageComponent } from './alert-list-page.component';

describe('AlertListPageComponent', () => {

  let component: AlertListPageComponent;
  let fixture: ComponentFixture<AlertListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
