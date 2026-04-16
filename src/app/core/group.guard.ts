import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const groupGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const groupId = route.paramMap.get('groupId');
  if (!groupId || !auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  const user = auth.currentUser();
  if (!user?.groupIds.includes(groupId)) {
    return router.createUrlTree(['/grupos']);
  }
  if (auth.currentGroupId() !== groupId) {
    auth.selectGroup(groupId);
  }
  return true;
};
