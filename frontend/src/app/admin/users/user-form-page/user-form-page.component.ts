import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  UserCreateRequest,
  UserRole,
  UserUpdateRequest
} from '../models/user.model';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './user-form-page.component.html',
  styleUrl: './user-form-page.component.css'
})
export class UserFormPageComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly roles: UserRole[] = [
    'ADMIN',
    'OPERATEUR',
    'LECTEUR'
  ];

  readonly form = this.formBuilder.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]
    ],
    password: [
      '',
      [
        Validators.minLength(8),
        Validators.maxLength(100)
      ]
    ],
    role: [
      'LECTEUR' as UserRole,
      Validators.required
    ]
  });

  userId: number | null = null;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.configureCreateMode();
      return;
    }

    const parsedId = Number(idParam);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      this.router.navigate(['/admin/users']);
      return;
    }

    this.userId = parsedId;
    this.configureEditMode();
    this.loadUser(parsedId);
  }

  get isEditMode(): boolean {
    return this.userId !== null;
  }

  get pageTitle(): string {
    return this.isEditMode
      ? 'Modifier un utilisateur'
      : 'Créer un utilisateur';
  }

  get submitLabel(): string {
    if (this.saving) {
      return 'Enregistrement...';
    }

    return this.isEditMode
      ? 'Enregistrer les modifications'
      : 'Créer l’utilisateur';
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get roleControl() {
    return this.form.controls.role;
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage =
        'Veuillez corriger les champs invalides avant de continuer.';
      return;
    }

    if (!this.isEditMode && !this.form.controls.password.value.trim()) {
      this.form.controls.password.setErrors({
        required: true
      });
      this.form.controls.password.markAsTouched();

      this.errorMessage =
        'Le mot de passe est obligatoire pour créer un utilisateur.';
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.userId !== null) {
      this.updateUser(this.userId);
      return;
    }

    this.createUser();
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

  private configureCreateMode(): void {
    this.form.controls.password.addValidators(
      Validators.required
    );
    this.form.controls.password.updateValueAndValidity();
  }

  private configureEditMode(): void {
    this.form.controls.password.disable();
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
  }

  private loadUser(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getUser(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          email: user.email,
          role: user.role
        });

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          'Impossible de charger l’utilisateur.'
        );

        this.loading = false;
      }
    });
  }

  private createUser(): void {
    const rawValue = this.form.getRawValue();

    const request: UserCreateRequest = {
      email: rawValue.email.trim().toLowerCase(),
      password: rawValue.password,
      role: rawValue.role
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.successMessage =
          'L’utilisateur a été créé avec succès.';

        this.saving = false;

        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 700);
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          'Impossible de créer l’utilisateur.'
        );

        this.saving = false;
      }
    });
  }

  private updateUser(id: number): void {
    const rawValue = this.form.getRawValue();

    const request: UserUpdateRequest = {
      email: rawValue.email.trim().toLowerCase(),
      role: rawValue.role
    };

    this.userService.updateUser(id, request).subscribe({
      next: () => {
        this.successMessage =
          'L’utilisateur a été modifié avec succès.';

        this.saving = false;

        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 700);
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          'Impossible de modifier l’utilisateur.'
        );

        this.saving = false;
      }
    });
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

      if (
        typeof responseBody === 'string' &&
        responseBody.trim()
      ) {
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

        if (
          typeof message === 'string' &&
          message.trim()
        ) {
          return message;
        }
      }
    }

    return fallbackMessage;
  }
}
