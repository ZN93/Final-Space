import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import {
  User,
  UserRole
} from '../models/user.model';
import { UserService } from '../services/user.service';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type RoleFilter = 'ALL' | UserRole;

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './user-list-page.component.html',
  styleUrl: './user-list-page.component.css'
})
export class UserListPageComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  users: User[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  roleFilter: RoleFilter = 'ALL';
  statusFilter: StatusFilter = 'ALL';
  searchTerm = '';

  updatingUserId: number | null = null;

  readonly roles: UserRole[] = [
    'ADMIN',
    'OPERATEUR',
    'LECTEUR'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  get currentUserEmail(): string | null {
    return this.authService.getUserEmail();
  }

  get filteredUsers(): User[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        this.roleFilter === 'ALL' ||
        user.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && user.active) ||
        (this.statusFilter === 'INACTIVE' && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get activeUserCount(): number {
    return this.users.filter((user) => user.active).length;
  }

  get inactiveUserCount(): number {
    return this.users.filter((user) => !user.active).length;
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = [...users].sort((first, second) =>
          first.email.localeCompare(second.email)
        );

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          'Impossible de charger les utilisateurs.'
        );

        this.loading = false;
      }
    });
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  updateRoleFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.roleFilter = select.value as RoleFilter;
  }

  updateStatusFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter = select.value as StatusFilter;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
  }

  isCurrentUser(user: User): boolean {
    return user.email === this.currentUserEmail;
  }

  canChangeStatus(user: User): boolean {
    return !this.isCurrentUser(user);
  }

  toggleStatus(user: User): void {
    if (!this.canChangeStatus(user)) {
      this.errorMessage =
        'Vous ne pouvez pas désactiver votre propre compte administrateur.';
      return;
    }

    const nextStatus = !user.active;
    const actionLabel = nextStatus ? 'activer' : 'désactiver';

    const confirmed = window.confirm(
      `Voulez-vous vraiment ${actionLabel} le compte ${user.email} ?`
    );

    if (!confirmed) {
      return;
    }

    this.updatingUserId = user.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateStatus(user.id, nextStatus).subscribe({
      next: (updatedUser) => {
        this.users = this.users.map((currentUser) =>
          currentUser.id === updatedUser.id
            ? updatedUser
            : currentUser
        );

        this.successMessage = nextStatus
          ? `Le compte ${updatedUser.email} a été activé.`
          : `Le compte ${updatedUser.email} a été désactivé.`;

        this.updatingUserId = null;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          `Impossible de ${actionLabel} le compte.`
        );

        this.updatingUserId = null;
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'OPERATEUR':
        return 'Opérateur';
      case 'LECTEUR':
        return 'Lecteur';
    }
  }

  formatDate(value: string): string {
    if (!value) {
      return 'Non renseignée';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  trackByUserId(
    index: number,
    user: User
  ): number {
    return user.id;
  }

  private extractErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error
    ) {
      const responseBody = (
        error as {
          error?: unknown;
        }
      ).error;

      if (typeof responseBody === 'string' && responseBody.trim()) {
        return responseBody;
      }

      if (
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
      ) {
        const message = (
          responseBody as {
            message?: unknown;
          }
        ).message;

        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }

    return fallbackMessage;
  }
}
