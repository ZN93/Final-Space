import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../testing/common-test-providers';
import { ForbiddenComponent } from './forbidden.component';

describe('ForbiddenComponent', () => {

  let component: ForbiddenComponent;
  let fixture: ComponentFixture<ForbiddenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
