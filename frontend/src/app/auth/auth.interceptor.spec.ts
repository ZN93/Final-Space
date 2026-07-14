import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate']
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptor])
        ),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: router
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('doit ajouter le token JWT dans l’en-tête Authorization', () => {
    localStorage.setItem(
      'finalspace_token',
      'jwt-token-test'
    );

    httpClient.get('/api/test').subscribe();

    const request = httpMock.expectOne('/api/test');

    expect(
      request.request.headers.get('Authorization')
    ).toBe('Bearer jwt-token-test');

    request.flush({});
  });

  it('ne doit pas ajouter Authorization sans token', () => {
    httpClient.get('/api/test').subscribe();

    const request = httpMock.expectOne('/api/test');

    expect(
      request.request.headers.has('Authorization')
    ).toBeFalse();

    request.flush({});
  });

  it('doit supprimer le token et rediriger vers login sur une erreur 401', () => {
    localStorage.setItem(
      'finalspace_token',
      'jwt-token-test'
    );

    let receivedStatus = -1;

    httpClient.get('/api/protected').subscribe({
      error: error => {
        receivedStatus = error.status;
      }
    });

    const request = httpMock.expectOne(
      '/api/protected'
    );

    request.flush(
      { message: 'Unauthorized' },
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    expect(receivedStatus).toBe(401);
    expect(
      localStorage.getItem('finalspace_token')
    ).toBeNull();

    expect(router.navigate)
      .toHaveBeenCalledOnceWith(['/login']);
  });

  it('doit rediriger vers forbidden sur une erreur 403', () => {
    localStorage.setItem(
      'finalspace_token',
      'jwt-token-test'
    );

    let receivedStatus = -1;

    httpClient.get('/api/admin').subscribe({
      error: error => {
        receivedStatus = error.status;
      }
    });

    const request = httpMock.expectOne('/api/admin');

    request.flush(
      { message: 'Forbidden' },
      {
        status: 403,
        statusText: 'Forbidden'
      }
    );

    expect(receivedStatus).toBe(403);
    expect(
      localStorage.getItem('finalspace_token')
    ).toBe('jwt-token-test');

    expect(router.navigate)
      .toHaveBeenCalledOnceWith(['/forbidden']);
  });

  it('doit transmettre les autres erreurs sans redirection', () => {
    let receivedStatus = -1;

    httpClient.get('/api/error').subscribe({
      error: error => {
        receivedStatus = error.status;
      }
    });

    const request = httpMock.expectOne('/api/error');

    request.flush(
      { message: 'Server error' },
      {
        status: 500,
        statusText: 'Server Error'
      }
    );

    expect(receivedStatus).toBe(500);
    expect(router.navigate)
      .not.toHaveBeenCalled();
  });
});

