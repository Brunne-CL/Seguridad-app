import { Routes } from '@angular/router';
import { authRoutes } from './auth.routes';
import { groupRoutes } from './group.routes';
import { userRoutes } from './user.routes';

export const routes: Routes = [
  ...authRoutes,
  ...groupRoutes,
  ...userRoutes,
  { path: '**', redirectTo: 'login' },
];
