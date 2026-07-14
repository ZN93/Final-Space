import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';

function createToken(payload: object): string {
  const header = btoa(
    JSON.stringify({
      alg: 'none',
      typ: 'JWT'
    })
  );

  const body = btoa(JSON.stringify(payload));

  return `${header}.${body}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('doit envoyer les identifiants et enregistrer le token', () => {
    const credentials = {
      email: 'admin@finalspace.fr',
      password: 'Password123!'
    };

    const token = createToken({
      sub: credentials.email,
      role: 'ROLE_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    service.login(credentials).subscribe(response => {
      expect(response.token).toBe(token);
      expect(localStorage.getItem('finalspace_token')).toBe(token);
    });

    const request = httpMock.expectOne('/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);

    request.flush({ token });
  });

  it('doit retourner le token enregistré', () => {
    localStorage.setItem(
      'finalspace_token',
      'test-token'
    );

    expect(service.getToken()).toBe('test-token');
  });

  it('doit retourner null sans token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('doit supprimer le token à la déconnexion', () => {
    localStorage.setItem(
      'finalspace_token',
      'test-token'
    );

    service.logout();

    expect(
      localStorage.getItem('finalspace_token')
    ).toBeNull();
  });

  it('doit considérer un token valide comme authentifié', () => {
    const token = createToken({
      sub: 'admin@finalspace.fr',
      role: 'ROLE_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('doit refuser un utilisateur sans token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('doit refuser et supprimer un token expiré', () => {
    const token = createToken({
      sub: 'admin@finalspace.fr',
      role: 'ROLE_ADMIN',
      exp: Math.floor(Date.now() / 1000) - 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('doit refuser et supprimer un token invalide', () => {
    localStorage.setItem(
      'finalspace_token',
      'token-invalide'
    );

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('doit extraire le rôle ADMIN', () => {
    const token = createToken({
      sub: 'admin@finalspace.fr',
      role: 'ROLE_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.getUserRole()).toBe('ADMIN');
    expect(service.isAdmin()).toBeTrue();
    expect(service.isOperateur()).toBeFalse();
    expect(service.isLecteur()).toBeFalse();
  });

  it('doit extraire le rôle OPERATEUR', () => {
    const token = createToken({
      sub: 'operateur@finalspace.fr',
      role: 'ROLE_OPERATEUR',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.getUserRole()).toBe('OPERATEUR');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isOperateur()).toBeTrue();
    expect(service.isLecteur()).toBeFalse();
  });

  it('doit extraire le rôle LECTEUR', () => {
    const token = createToken({
      sub: 'lecteur@finalspace.fr',
      role: 'ROLE_LECTEUR',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.getUserRole()).toBe('LECTEUR');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isOperateur()).toBeFalse();
    expect(service.isLecteur()).toBeTrue();
  });

  it('doit retourner null pour le rôle sans token', () => {
    expect(service.getUserRole()).toBeNull();
  });

  it('doit retourner null pour un rôle contenu dans un token invalide', () => {
    localStorage.setItem(
      'finalspace_token',
      'token-invalide'
    );

    expect(service.getUserRole()).toBeNull();
  });

  it('doit extraire l’adresse email', () => {
    const token = createToken({
      sub: 'user@finalspace.fr',
      role: 'ROLE_LECTEUR',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem(
      'finalspace_token',
      token
    );

    expect(service.getUserEmail()).toBe(
      'user@finalspace.fr'
    );
  });

  it('doit retourner null pour l’email sans token', () => {
    expect(service.getUserEmail()).toBeNull();
  });

  it('doit retourner null pour l’email avec un token invalide', () => {
    localStorage.setItem(
      'finalspace_token',
      'token-invalide'
    );

    expect(service.getUserEmail()).toBeNull();
  });
});
