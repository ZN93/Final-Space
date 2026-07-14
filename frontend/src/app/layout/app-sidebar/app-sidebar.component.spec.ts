import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../auth/auth.service';
import { COMMON_TEST_PROVIDERS } from '../../testing/common-test-providers';
import { AppSidebarComponent } from './app-sidebar.component';

describe('AppSidebarComponent', () => {

  let component: AppSidebarComponent;
  let fixture: ComponentFixture<AppSidebarComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['isAdmin']
    );

    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppSidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide administration navigation for a non-admin user', () => {
    authService.isAdmin.and.returnValue(false);

    const routes = component.visibleItems.map(item => item.route);

    expect(routes).not.toContain('/admin/users');
  });

  it('should display administration navigation for an admin user', () => {
    authService.isAdmin.and.returnValue(true);

    const routes = component.visibleItems.map(item => item.route);

    expect(routes).toContain('/admin/users');
  });

  it('should expose dashboard as an exact route', () => {
    const dashboardItem = component.items.find(
      item => item.route === '/dashboard'
    );

    expect(dashboardItem?.exact).toBeTrue();
  });

});
