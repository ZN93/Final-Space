import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  role = this.authService.getUserRole();

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
