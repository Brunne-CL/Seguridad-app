import { Injectable, signal, computed } from '@angular/core';
import { User, Permission, PERMISSIONS } from './models';
import { DataService } from './data.service';

const ALL_PERMISSION_VALUES = Object.values(PERMISSIONS) as Permission[];

const STORAGE_SESSION_USER_ID = 'app-seguridad-session-userId';
const STORAGE_SESSION_GROUP_ID = 'app-seguridad-session-groupId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserId = signal<string | null>(this.getStoredUserId());
  readonly currentGroupId = signal<string | null>(this.getStoredGroupId());

  readonly currentUser = computed(() => {
    const id = this.currentUserId();
    return id ? this.data.getUserById(id) ?? null : null;
  });

  readonly currentGroup = computed(() => {
    const gid = this.currentGroupId();
    return gid ? this.data.groups().find((g) => g.id === gid) ?? null : null;
  });

  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  readonly groupsForCurrentUser = computed(() => {
    const user = this.currentUser();
    return user ? this.data.getGroupsForUser(user.id) : [];
  });

  constructor(private data: DataService) {}

  private getStoredUserId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_SESSION_USER_ID);
  }

  private getStoredGroupId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_SESSION_GROUP_ID);
  }

  login(usuario: string, password: string): boolean {
    const user = this.data.getUserByUsuario(usuario);
    if (!user || user.password !== password) return false;
    this.currentUserId.set(user.id);
    this.currentGroupId.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_SESSION_USER_ID, user.id);
      localStorage.removeItem(STORAGE_SESSION_GROUP_ID);
    }
    return true;
  }

  /** Super usuario: tiene todos los permisos; entra directo al dashboard y gestiona todos los grupos desde ahí. */
  isSuperUser(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return ALL_PERMISSION_VALUES.every((p) => user.permissions.includes(p));
  }

  /** Puede entrar al dashboard general sin elegir grupo (super y admin con permisos de gestión de grupo). */
  canAccessGeneralDashboard(): boolean {
    return this.isSuperUser() || this.canManageGroup();
  }

  selectGroup(groupId: string): void {
    const user = this.currentUser();
    if (!user) return;
    if (groupId && !this.isSuperUser() && !user.groupIds.includes(groupId)) return;
    this.currentGroupId.set(groupId || null);
    if (typeof localStorage !== 'undefined') {
      if (groupId) localStorage.setItem(STORAGE_SESSION_GROUP_ID, groupId);
      else localStorage.removeItem(STORAGE_SESSION_GROUP_ID);
    }
  }

  clearGroup(): void {
    this.currentGroupId.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_SESSION_GROUP_ID);
    }
  }

  logout(): void {
    this.currentUserId.set(null);
    this.currentGroupId.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_SESSION_USER_ID);
      localStorage.removeItem(STORAGE_SESSION_GROUP_ID);
    }
  }

  /** Todo se perfila por permisos, NO por roles. */
  hasPermission(permission: Permission): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /** Permisos CRUD de grupo: group:add, group:edit, group:delete */
  canManageGroup(): boolean {
    return this.hasAnyPermission([
      PERMISSIONS.GROUP_MANAGE,
      PERMISSIONS.GROUP_ADD,
      PERMISSIONS.GROUP_EDIT,
      PERMISSIONS.GROUP_DELETE,
    ]);
  }

  /** Permisos CRUD de usuario (superAdmin tiene todos) */
  canManageUsers(): boolean {
    return this.hasAnyPermission([
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.USER_VIEW_ALL,
      PERMISSIONS.USER_ADD,
      PERMISSIONS.USER_EDIT,
      PERMISSIONS.USER_DELETE,
    ]);
  }
}
