import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['isAuthenticated']
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate']
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authService
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    });
  });

  it('doit autoriser un utilisateur authentifié', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(
      () => authGuard(
        {} as never,
        {} as never
      )
    );

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('doit refuser un utilisateur non authentifié', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(
      () => authGuard(
        {} as never,
        {} as never
      )
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(
      ['/login']
    );
  });
});
