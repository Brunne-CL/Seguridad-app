import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SuperDashboardComponent } from './pages/super-dashboard/super-dashboard.component';
import { authGuard } from './core/auth.guard';
import { dashboardGuard } from './core/permission.guard';

export const authRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'dashboard', component: SuperDashboardComponent, canActivate: [authGuard, dashboardGuard] },
];