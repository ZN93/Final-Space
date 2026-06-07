import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { MissionListComponent } from './missions/mission-list/mission-list.component';
import { MissionFormComponent } from './missions/mission-form/mission-form.component';
import { MissionDetailComponent } from './missions/mission-detail/mission-detail.component';
import { MissionDashboardPageComponent } from './mission-dashboard/mission-dashboard-page/mission-dashboard-page.component';
import { MissionAlertListComponent } from './alerts/mission-alert-list/mission-alert-list.component';
import { MissionIncidentListComponent } from './incidents/mission-incident-list/mission-incident-list.component';

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
    path: 'missions/:id/dashboard',
    canActivate: [authGuard],
    component: MissionDashboardPageComponent
  },
  {
    path: 'missions/:id/alerts',
    canActivate: [authGuard],
    component: MissionAlertListComponent
  },
  {
    path: 'missions/:id/incidents',
    canActivate: [authGuard],
    component: MissionIncidentListComponent
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
