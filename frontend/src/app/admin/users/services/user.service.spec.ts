import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  User,
  UserCreateRequest,
  UserUpdateRequest
} from '../models/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const user: User = {
    id: 1,
    email: 'admin@finalspace.fr',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-07-14T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit charger tous les utilisateurs', () => {
    service.getUsers().subscribe(result => {
      expect(result).toEqual([user]);
    });

    const request = httpMock.expectOne('/api/users');

    expect(request.request.method).toBe('GET');

    request.flush([user]);
  });

  it('doit charger un utilisateur par identifiant', () => {
    service.getUser(1).subscribe(result => {
      expect(result).toEqual(user);
    });

    const request = httpMock.expectOne(
      '/api/users/1'
    );

    expect(request.request.method).toBe('GET');

    request.flush(user);
  });

  it('doit créer un utilisateur', () => {
    const createRequest: UserCreateRequest = {
      email: 'operateur@finalspace.fr',
      password: 'Password123!',
      role: 'OPERATEUR'
    };

    const createdUser: User = {
      id: 2,
      email: createRequest.email,
      role: createRequest.role,
      active: true,
      createdAt: '2026-07-14T11:00:00Z'
    };

    service
      .createUser(createRequest)
      .subscribe(result => {
        expect(result).toEqual(createdUser);
      });

    const request = httpMock.expectOne('/api/users');

    expect(request.request.method).toBe('POST');
    expect(request.request.body)
      .toEqual(createRequest);

    request.flush(createdUser);
  });

  it('doit modifier un utilisateur', () => {
    const updateRequest: UserUpdateRequest = {
      email: 'admin.updated@finalspace.fr',
      role: 'ADMIN'
    };

    service
      .updateUser(1, updateRequest)
      .subscribe(result => {
        expect(result.email)
          .toBe(updateRequest.email);
      });

    const request = httpMock.expectOne(
      '/api/users/1'
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body)
      .toEqual(updateRequest);

    request.flush({
      ...user,
      email: updateRequest.email
    });
  });

  it('doit désactiver un utilisateur', () => {
    service.updateStatus(1, false).subscribe(result => {
      expect(result.active).toBeFalse();
    });

    const request = httpMock.expectOne(
      '/api/users/1/status'
    );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      active: false
    });

    request.flush({
      ...user,
      active: false
    });
  });

  it('doit réactiver un utilisateur', () => {
    service.updateStatus(1, true).subscribe(result => {
      expect(result.active).toBeTrue();
    });

    const request = httpMock.expectOne(
      '/api/users/1/status'
    );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      active: true
    });

    request.flush(user);
  });
});
