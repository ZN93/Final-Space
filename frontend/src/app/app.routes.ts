import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { MissionListComponent } from './missions/mission-list/mission-list.component';
import { MissionFormComponent } from './missions/mission-form/mission-form.component';
import { MissionDetailComponent } from './missions/mission-detail/mission-detail.component';
import { MissionDashboardPageComponent } from './mission-dashboard/mission-dashboard-page/mission-dashboard-page.component';
import { MissionAlertListComponent } from './alerts/mission-alert-list/mission-alert-list.component';
import { MissionIncidentListComponent } from './incidents/mission-incident-list/mission-incident-list.component';
import { SatelliteDetailComponent } from './satellites/satellite-detail/satellite-detail.component';
import { SimulationDetailComponent } from './simulations/simulation-detail/simulation-detail.component';
import { SatelliteListPageComponent } from './satellites/satellite-list-page/satellite-list-page.component';
import { SimulationListPageComponent } from './simulations/simulation-list-page/simulation-list-page.component';
import { TelemetryPageComponent } from './telemetry/telemetry-page/telemetry-page.component';
import { AlertListPageComponent } from './alerts/alert-list-page/alert-list-page.component';
import { IncidentListPageComponent } from './incidents/incident-list-page/incident-list-page.component';
import { ReportPageComponent } from './reports/report-page/report-page.component';

import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./forbidden/forbidden.component')
        .then(m => m.ForbiddenComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'missions',
        component: MissionListComponent
      },
      {
        path: 'satellites',
        component: SatelliteListPageComponent
      },
      {
        path: 'simulations',
        component: SimulationListPageComponent
      },
      {
        path: 'telemetry',
        component: TelemetryPageComponent
      },
      {
        path: 'alerts',
        component: AlertListPageComponent
      },
      {
        path: 'incidents',
        component: IncidentListPageComponent
      },
      {
        path: 'reports',
        component: ReportPageComponent
      },
      {
        path: 'missions/create',
        component: MissionFormComponent
      },
      {
        path: 'missions/:id/dashboard',
        component: MissionDashboardPageComponent
      },
      {
        path: 'missions/:id/alerts',
        component: MissionAlertListComponent
      },
      {
        path: 'missions/:id/incidents',
        component: MissionIncidentListComponent
      },
      {
        path: 'missions/:id',
        component: MissionDetailComponent
      },
      {
        path: 'satellites/:id',
        component: SatelliteDetailComponent
      },
      {
        path: 'simulations/:id',
        component: SimulationDetailComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
