import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { UserListPageComponent } from './user-list-page.component';

describe('UserListPageComponent', () => {
  let component: UserListPageComponent;
  let fixture: ComponentFixture<UserListPageComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;

  const admin: User = { id: 1, email: 'admin@finalspace.fr', role: 'ADMIN', active: true, createdAt: '2026-07-14T10:00:00Z' };
  const operator: User = { id: 2, email: 'operator@finalspace.fr', role: 'OPERATEUR', active: true, createdAt: '2026-07-14T11:00:00Z' };
  const reader: User = { id: 3, email: 'reader@finalspace.fr', role: 'LECTEUR', active: false, createdAt: '2026-07-14T12:00:00Z' };

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['getUsers', 'updateStatus']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getUserEmail']);
    userService.getUsers.and.returnValue(of([]));
    authService.getUserEmail.and.returnValue(admin.email);

    await TestBed.configureTestingModule({
      imports: [UserListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: userService
        },
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListPageComponent);
    component = fixture.componentInstance;
  });

  it('doit créer le composant', () => expect(component).toBeTruthy());
  it('doit retourner le compte courant', () => expect(component.currentUserEmail).toBe(admin.email));

  it('doit charger et trier les utilisateurs', () => {
    userService.getUsers.and.returnValue(of([reader, operator, admin]));
    component.loadUsers();
    expect(component.users.map(user => user.email)).toEqual([admin.email, operator.email, reader.email]);
    expect(component.loading).toBeFalse();
  });

  it('doit utiliser une erreur textuelle', () => {
    userService.getUsers.and.returnValue(throwError(() => ({ error: 'Accès refusé' })));
    component.loadUsers();
    expect(component.errorMessage).toBe('Accès refusé');
  });

  it('doit utiliser une erreur objet', () => {
    userService.getUsers.and.returnValue(throwError(() => ({ error: { message: 'Erreur métier' } })));
    component.loadUsers();
    expect(component.errorMessage).toBe('Erreur métier');
  });

  it('doit utiliser le fallback pour une erreur sans détail', () => {
    userService.getUsers.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadUsers();
    expect(component.errorMessage).toBe('Impossible de charger les utilisateurs.');
  });

  it('doit utiliser le fallback pour un texte vide', () => {
    userService.getUsers.and.returnValue(throwError(() => ({ error: '   ' })));
    component.loadUsers();
    expect(component.errorMessage).toBe('Impossible de charger les utilisateurs.');
  });

  it('doit utiliser le fallback pour un message objet vide', () => {
    userService.getUsers.and.returnValue(throwError(() => ({ error: { message: '   ' } })));
    component.loadUsers();
    expect(component.errorMessage).toBe('Impossible de charger les utilisateurs.');
  });

  it('doit retourner tous les utilisateurs sans filtre', () => {
    component.users = [admin, operator, reader];
    expect(component.filteredUsers).toEqual([admin, operator, reader]);
  });

  it('doit filtrer par recherche', () => {
    component.users = [admin, operator, reader];
    component.searchTerm = 'operator';
    expect(component.filteredUsers).toEqual([operator]);
  });

  it('doit ignorer les espaces et la casse', () => {
    component.users = [admin, operator];
    component.searchTerm = '  ADMIN  ';
    expect(component.filteredUsers).toEqual([admin]);
  });

  it('doit filtrer par rôle ADMIN', () => {
    component.users = [admin, operator, reader];
    component.roleFilter = 'ADMIN';
    expect(component.filteredUsers).toEqual([admin]);
  });

  it('doit filtrer par rôle OPERATEUR', () => {
    component.users = [admin, operator, reader];
    component.roleFilter = 'OPERATEUR';
    expect(component.filteredUsers).toEqual([operator]);
  });

  it('doit filtrer par rôle LECTEUR', () => {
    component.users = [admin, operator, reader];
    component.roleFilter = 'LECTEUR';
    expect(component.filteredUsers).toEqual([reader]);
  });

  it('doit filtrer les actifs', () => {
    component.users = [admin, operator, reader];
    component.statusFilter = 'ACTIVE';
    expect(component.filteredUsers).toEqual([admin, operator]);
  });

  it('doit filtrer les inactifs', () => {
    component.users = [admin, operator, reader];
    component.statusFilter = 'INACTIVE';
    expect(component.filteredUsers).toEqual([reader]);
  });

  it('doit combiner tous les filtres', () => {
    component.users = [admin, operator, reader];
    component.searchTerm = 'reader';
    component.roleFilter = 'LECTEUR';
    component.statusFilter = 'INACTIVE';
    expect(component.filteredUsers).toEqual([reader]);
  });

  it('doit calculer les compteurs', () => {
    component.users = [admin, operator, reader];
    expect(component.activeUserCount).toBe(2);
    expect(component.inactiveUserCount).toBe(1);
  });

  it('doit mettre à jour les filtres depuis les événements', () => {
    component.updateSearchTerm({ target: { value: 'admin' } } as any);
    component.updateRoleFilter({ target: { value: 'ADMIN' } } as any);
    component.updateStatusFilter({ target: { value: 'ACTIVE' } } as any);
    expect(component.searchTerm).toBe('admin');
    expect(component.roleFilter).toBe('ADMIN');
    expect(component.statusFilter).toBe('ACTIVE');
  });

  it('doit réinitialiser les filtres', () => {
    component.searchTerm = 'x'; component.roleFilter = 'ADMIN'; component.statusFilter = 'ACTIVE';
    component.resetFilters();
    expect(component.searchTerm).toBe('');
    expect(component.roleFilter).toBe('ALL');
    expect(component.statusFilter).toBe('ALL');
  });

  it('doit reconnaître le compte courant', () => {
    expect(component.isCurrentUser(admin)).toBeTrue();
    expect(component.isCurrentUser(operator)).toBeFalse();
  });

  it('doit interdire le changement du compte courant', () => {
    expect(component.canChangeStatus(admin)).toBeFalse();
    expect(component.canChangeStatus(operator)).toBeTrue();
  });

  it('doit refuser la désactivation du compte courant', () => {
    component.toggleStatus(admin);
    expect(component.errorMessage).toContain('propre compte');
    expect(userService.updateStatus).not.toHaveBeenCalled();
  });

  it('doit abandonner sans confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.toggleStatus(operator);
    expect(userService.updateStatus).not.toHaveBeenCalled();
  });

  it('doit désactiver un utilisateur actif', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const updated = { ...operator, active: false };
    userService.updateStatus.and.returnValue(of(updated));
    component.users = [admin, operator, reader];
    component.toggleStatus(operator);
    expect(userService.updateStatus).toHaveBeenCalledOnceWith(operator.id, false);
    expect(component.users[1].active).toBeFalse();
    expect(component.successMessage).toContain(operator.email);
    expect(component.updatingUserId).toBeNull();
  });

  it('doit activer un utilisateur inactif', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const updated = { ...reader, active: true };
    userService.updateStatus.and.returnValue(of(updated));
    component.users = [admin, operator, reader];
    component.toggleStatus(reader);
    expect(userService.updateStatus).toHaveBeenCalledOnceWith(reader.id, true);
    expect(component.successMessage).toContain(reader.email);
  });

  it('doit utiliser une erreur serveur lors du changement de statut', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userService.updateStatus.and.returnValue(throwError(() => ({ error: 'Modification interdite' })));
    component.toggleStatus(operator);
    expect(component.errorMessage).toBe('Modification interdite');
    expect(component.updatingUserId).toBeNull();
  });

  it('doit utiliser le fallback de désactivation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userService.updateStatus.and.returnValue(throwError(() => ({ status: 500 })));
    component.toggleStatus(operator);
    expect(component.errorMessage).toContain('désactiver');
  });

  it('doit utiliser le fallback d’activation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userService.updateStatus.and.returnValue(throwError(() => ({ status: 500 })));
    component.toggleStatus(reader);
    expect(component.errorMessage).toContain('activer');
  });

  it('doit retourner les libellés des rôles', () => {
    expect(component.getRoleLabel('ADMIN')).toBe('Administrateur');
    expect(component.getRoleLabel('OPERATEUR')).toContain('rateur');
    expect(component.getRoleLabel('LECTEUR')).toBe('Lecteur');
  });

  it('doit formater une date valide', () => {
    expect(component.formatDate('2026-07-14T10:00:00Z')).not.toBe('2026-07-14T10:00:00Z');
  });

  it('doit conserver une date invalide', () => expect(component.formatDate('invalide')).toBe('invalide'));
  it('doit gérer une date vide', () => expect(component.formatDate('')).toContain('Non renseign'));
  it('doit retourner l’identifiant trackBy', () => expect(component.trackByUserId(0, admin)).toBe(admin.id));
});


