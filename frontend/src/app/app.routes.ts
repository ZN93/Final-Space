import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { MissionListComponent } from './missions/mission-list/mission-list.component';
import { MissionFormComponent } from './missions/mission-form/mission-form.component';
import { MissionDetailComponent } from './missions/mission-detail/mission-detail.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'missions',
    canActivate: [authGuard],
    component: MissionListComponent
  },
  {
    path: 'missions/create',
    canActivate: [authGuard],
    component: MissionFormComponent
  },
  {
    path: 'missions/:id',
    canActivate: [authGuard],
    component: MissionDetailComponent
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
