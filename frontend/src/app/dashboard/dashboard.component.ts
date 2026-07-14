import { CommonModule } from '@angular/common';
import {
  Component,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { NAVIGATION_ITEMS } from '../layout/config/navigation-items';
import { NavigationItem } from '../layout/models/navigation-item.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private readonly authService = inject(AuthService);

  readonly role = this.authService.getUserRole();

  get modules(): NavigationItem[] {
    return NAVIGATION_ITEMS.filter(
      item =>
        item.route !== '/dashboard' &&
        (
          !item.adminOnly ||
          this.role === 'ADMIN'
        )
    );
  }

  get roleLabel(): string {
    switch (this.role) {
      case 'ADMIN':
        return 'Administrateur';

      case 'OPERATEUR':
        return 'Opérateur';

      case 'LECTEUR':
        return 'Lecteur';

      default:
        return 'Utilisateur';
    }
  }

  get canManage(): boolean {
    return (
      this.role === 'ADMIN' ||
      this.role === 'OPERATEUR'
    );
  }

  trackByRoute(
    index: number,
    item: NavigationItem
  ): string {
    return item.route;
  }
}
