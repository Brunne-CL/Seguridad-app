import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission } from './models';

export const requirePermission = (permission: Permission): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    if (!auth.hasPermission(permission)) return router.createUrlTree(['/grupos']);
    return true;
  };
};

export const requireAnyPermission = (permissions: Permission[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    if (!auth.hasAnyPermission(permissions)) return router.createUrlTree(['/grupos']);
    return true;
  };
};

/** Acceso al dashboard general sin elegir grupo: super usuario o quien tenga permisos de gestión de grupo (admin). */
export const dashboardGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!auth.canAccessGeneralDashboard()) return router.createUrlTree(['/grupos']);
  return true;
};
