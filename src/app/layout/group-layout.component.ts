import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../core/auth.service';
import { ROUTE_LINKS } from '../core/routes';

@Component({
  selector: 'app-group-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MenuModule, ButtonModule, AvatarModule],
  templateUrl: './group-layout.component.html',
  styleUrl: './group-layout.component.scss',
})
export class GroupLayoutComponent {
  menuVisible = signal(false);
  groupId = computed(() => this.auth.currentGroupId() ?? '');
  routes = ROUTE_LINKS;

  menuItems: MenuItem[] = [];

  constructor(
    public auth: AuthService,
    private router: Router
  ) {
    this.buildMenu();
  }

  private buildMenu(): void {
    this.menuItems = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: () => [this.routes.groupDashboard(this.groupId())] },
      { label: 'Vista lista', icon: 'pi pi-list', routerLink: () => [this.routes.groupList(this.groupId())] },
      { label: 'Mi perfil', icon: 'pi pi-user', routerLink: () => [this.routes.profile] },
    ];
    if (this.auth.canManageGroup()) {
      this.menuItems.push({
        label: 'Gestión de grupo',
        icon: 'pi pi-cog',
        routerLink: () => ['/grupo', this.groupId(), 'gestion-grupo'],
      });
    }
    if (this.auth.canManageUsers()) {
      this.menuItems.push({
        label: 'Gestión de usuarios',
        icon: 'pi pi-users',
        routerLink: () => ['/usuarios'],
      });
    }
  }

  get groupName(): string {
    const g = this.auth.currentGroup();
    return g?.nombre ?? 'Grupo';
  }

  get userLabel(): string {
    const u = this.auth.currentUser();
    return u?.nombreCompleto || u?.usuario || '';
  }

  toggleMenu(): void {
    this.menuVisible.update((v) => !v);
  }

  goPerfil(): void {
    this.menuVisible.set(false);
    this.router.navigate([this.routes.profile]);
  }

  goDashboard(): void {
    this.menuVisible.set(false);
    this.router.navigate([this.routes.dashboard]);
  }

  goCambiarGrupo(): void {
    this.menuVisible.set(false);
    this.auth.clearGroup();
    this.router.navigate([this.routes.groups]);
  }

  logout(): void {
    this.menuVisible.set(false);
    this.auth.logout();
    this.router.navigate([this.routes.login]);
  }
}
