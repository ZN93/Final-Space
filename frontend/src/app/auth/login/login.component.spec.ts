import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {

  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
