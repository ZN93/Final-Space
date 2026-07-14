import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {

  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
