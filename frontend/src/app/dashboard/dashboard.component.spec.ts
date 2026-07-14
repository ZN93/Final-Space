import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../auth/auth.service';
import { COMMON_TEST_PROVIDERS } from '../testing/common-test-providers';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {

  let fixture: ComponentFixture<DashboardComponent>;

  function createComponent(
    role: 'ADMIN' | 'OPERATEUR' | 'LECTEUR'
  ): DashboardComponent {
    const authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['getUserRole']
    );

    authService.getUserRole.and.returnValue(role);

    TestBed.overrideProvider(AuthService, {
      useValue: authService
    });

    fixture = TestBed.createComponent(DashboardComponent);

    return fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const component = createComponent('LECTEUR');

    expect(component).toBeTruthy();
  });

  it('should hide the dashboard entry from module cards', () => {
    const component = createComponent('LECTEUR');

    expect(
      component.modules.some(
        item => item.route === '/dashboard'
      )
    ).toBeFalse();
  });

  it('should hide user administration for a reader', () => {
    const component = createComponent('LECTEUR');

    expect(
      component.modules.some(
        item => item.route === '/admin/users'
      )
    ).toBeFalse();
  });

  it('should display user administration for an administrator', () => {
    const component = createComponent('ADMIN');

    expect(
      component.modules.some(
        item => item.route === '/admin/users'
      )
    ).toBeTrue();
  });

  it('should return the administrator label', () => {
    const component = createComponent('ADMIN');

    expect(component.roleLabel).toBe('Administrateur');
    expect(component.canManage).toBeTrue();
  });

  it('should return the operator label', () => {
    const component = createComponent('OPERATEUR');

    expect(component.roleLabel).toBe('Opérateur');
    expect(component.canManage).toBeTrue();
  });

  it('should keep the route as tracking identifier', () => {
    const component = createComponent('LECTEUR');
    const item = component.modules[0];

    expect(component.trackByRoute(0, item)).toBe(item.route);
  });

});
