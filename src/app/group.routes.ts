import { Routes } from '@angular/router';
import { GroupSelectComponent } from './pages/group-select/group-select.component';
import { GroupLayoutComponent } from './layout/group-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/auth.guard';
import { groupGuard } from './core/group.guard';
import { requireAnyPermission } from './core/permission.guard';
import { PERMISSIONS } from './core/models';

const groupManagePerms = [PERMISSIONS.GROUP_ADD, PERMISSIONS.GROUP_EDIT, PERMISSIONS.GROUP_DELETE];

export const groupRoutes: Routes = [
  { path: 'grupos', component: GroupSelectComponent, canActivate: [authGuard] },
  {
    path: 'grupo/:groupId',
    component: GroupLayoutComponent,
    canActivate: [authGuard, groupGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'kanban', redirectTo: 'lista', pathMatch: 'full' },
      {
        path: 'lista',
        loadComponent: () => import('./pages/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
      },
      {
        path: 'gestion-grupo',
        loadComponent: () =>
          import('./pages/group-management/group-management.component').then(m => m.GroupManagementComponent),
        canActivate: [requireAnyPermission(groupManagePerms)],
      },
      {
        path: 'ticket/nuevo',
        loadComponent: () => import('./pages/ticket-create/ticket-create.component').then(m => m.TicketCreateComponent),
      },
      {
        path: 'ticket/:ticketId',
        loadComponent: () =>
          import('./pages/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
      },
    ],
  },
];

