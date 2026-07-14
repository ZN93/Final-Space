import { TestBed } from '@angular/core/testing';
import {
  Router,
  UrlTree
} from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const loginUrlTree = {} as UrlTree;
  const forbiddenUrlTree = {} as UrlTree;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      [
        'isAuthenticated',
        'isAdmin'
      ]
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['createUrlTree']
    );

    router.createUrlTree.and.callFake(commands => {
      if (commands[0] === '/login') {
        return loginUrlTree;
      }

      return forbiddenUrlTree;
    });

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

  it('doit rediriger vers login si l’utilisateur n’est pas authentifié', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(
      () => adminGuard(
        {} as never,
        {} as never
      )
    );

    expect(result).toBe(loginUrlTree);
    expect(router.createUrlTree)
      .toHaveBeenCalledOnceWith(['/login']);
    expect(authService.isAdmin)
      .not.toHaveBeenCalled();
  });

  it('doit rediriger vers forbidden si l’utilisateur n’est pas administrateur', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(
      () => adminGuard(
        {} as never,
        {} as never
      )
    );

    expect(result).toBe(forbiddenUrlTree);
    expect(router.createUrlTree)
      .toHaveBeenCalledOnceWith(['/forbidden']);
  });

  it('doit autoriser un administrateur authentifié', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(
      () => adminGuard(
        {} as never,
        {} as never
      )
    );

    expect(result).toBeTrue();
    expect(router.createUrlTree)
      .not.toHaveBeenCalled();
  });
});
