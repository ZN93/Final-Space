export type UserRole = 'ADMIN' | 'OPERATEUR' | 'LECTEUR';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  email: string;
  role: UserRole;
}

export interface UserStatusRequest {
  active: boolean;
}
