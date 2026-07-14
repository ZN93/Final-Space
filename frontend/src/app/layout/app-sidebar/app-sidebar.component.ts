import { NgClass, NgFor } from '@angular/common';
import {
  Component,
  Input,
  inject
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { NAVIGATION_ITEMS } from '../config/navigation-items';
import { NavigationItem } from '../models/navigation-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css'
})
export class AppSidebarComponent {

  private readonly authService = inject(AuthService);

  @Input()
  collapsed = false;

  readonly items = NAVIGATION_ITEMS;

  get visibleItems(): NavigationItem[] {
    return this.items.filter(
      item =>
        !item.adminOnly ||
        this.authService.isAdmin()
    );
  }
}
