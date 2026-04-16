import { Routes } from '@angular/router';
import { PERMISSIONS } from './core/models';
import { authGuard } from './core/auth.guard';
import { requireAnyPermission } from './core/permission.guard';

export const userRoutes: Routes = [
  {
    path: 'perfil',
    loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [
      authGuard,
      requireAnyPermission([
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.USER_VIEW_ALL,
        PERMISSIONS.USER_ADD,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.USER_DELETE,
      ]),
    ],
  },
];

