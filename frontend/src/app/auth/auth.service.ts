import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly tokenKey = 'finalspace_token';

  private readonly apiUrl = '';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
        `/auth/login`,
        credentials
    ).pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
        })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role.replace('ROLE_', '');
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  isOperateur(): boolean {
    return this.getUserRole() === 'OPERATEUR';
  }

  isLecteur(): boolean {
    return this.getUserRole() === 'LECTEUR';
  }
}
