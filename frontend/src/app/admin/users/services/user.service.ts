import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  User,
  UserCreateRequest,
  UserStatusRequest,
  UserUpdateRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(request: UserCreateRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  updateUser(id: number, request: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request);
  }

  updateStatus(id: number, active: boolean): Observable<User> {
    const request: UserStatusRequest = { active };

    return this.http.patch<User>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }
}
