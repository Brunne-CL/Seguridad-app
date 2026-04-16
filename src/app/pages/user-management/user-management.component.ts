import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { PERMISSIONS, type Permission } from '../../core/models';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { passwordStrengthValidator, mayorDeEdadValidator, telefonoValidator } from '../../core/validators';

/** Todos los permisos definidos en core/models; así la gestión de usuarios siempre muestra los mismos. */
const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Etiquetas en español para la UI. Debe incluir todos los permisos de PERMISSIONS en models. */
const PERMISSION_LABELS: Record<string, string> = {
  // Usuario
  [PERMISSIONS.USER_VIEW]: 'Ver su propio usuario',
  [PERMISSIONS.USER_ADD]: 'Crear usuarios',
  [PERMISSIONS.USER_EDIT]: 'Editar usuarios',
  [PERMISSIONS.USER_EDIT_PROFILE]: 'Editar perfil propio',
  [PERMISSIONS.USER_DELETE]: 'Eliminar usuarios',
  [PERMISSIONS.USER_ASSIGN]: 'Asignar usuarios a grupos / tickets',
  [PERMISSIONS.USER_VIEW_ALL]: 'Ver todos los usuarios',
  [PERMISSIONS.USER_EDIT_PERMISSIONS]: 'Editar permisos de usuarios',
  [PERMISSIONS.USER_DEACTIVATE]: 'Desactivar usuarios',
  [PERMISSIONS.USER_ACTIVATE]: 'Activar usuarios',
  [PERMISSIONS.USER_MANAGE]: 'Gestionar usuarios (permiso global)',

  // Grupo
  [PERMISSIONS.GROUP_VIEW]: 'Ver grupos',
  [PERMISSIONS.GROUP_ADD]: 'Crear grupos',
  [PERMISSIONS.GROUP_EDIT]: 'Editar grupos',
  [PERMISSIONS.GROUP_DELETE]: 'Eliminar grupos',
  [PERMISSIONS.GROUP_ADD_MEMBER]: 'Añadir miembros al grupo',
  [PERMISSIONS.GROUP_REMOVE_MEMBER]: 'Quitar miembros del grupo',
  [PERMISSIONS.GROUP_MANAGE]: 'Gestionar grupos (permiso global)',

  // Ticket
  [PERMISSIONS.TICKET_VIEW]: 'Ver tickets',
  [PERMISSIONS.TICKET_ADD]: 'Crear tickets',
  [PERMISSIONS.TICKET_EDIT]: 'Editar tickets',
  [PERMISSIONS.TICKET_DELETE]: 'Eliminar tickets',
  [PERMISSIONS.TICKET_EDIT_STATE]: 'Cambiar estado del ticket',
  [PERMISSIONS.TICKET_EDIT_COMMENT]: 'Editar comentarios del ticket',
  [PERMISSIONS.TICKET_EDIT_PRIORITY]: 'Cambiar prioridad del ticket',
  [PERMISSIONS.TICKET_EDIT_DEADLINE]: 'Cambiar fecha límite del ticket',
  [PERMISSIONS.TICKET_EDIT_ASSIGN]: 'Asignar tickets a usuarios',
  [PERMISSIONS.TICKET_MANAGE]: 'Gestionar tickets (permiso global)',
};

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    CheckboxModule,
    DialogModule,
    DatePickerModule,
    ToastModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private message = inject(MessageService);

  users = this.data.users;
  currentUserId = computed(() => this.auth.currentUser()?.id ?? '');
  permissionList = ALL_PERMISSIONS;

  permissionLabel(permission: Permission): string {
    return PERMISSION_LABELS[permission] ?? permission;
  }

  showCreateDialog = signal(false);
  showPermsDialog = signal(false);
  editingUserId = signal<string | null>(null);

  createForm: FormGroup;
  permsForm: FormGroup | null = null;

  constructor() {
    this.createForm = this.fb.nonNullable.group({
      usuario: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator()]],
      nombreCompleto: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, telefonoValidator()]],
      fechaNacimiento: [null as Date | null, [Validators.required, mayorDeEdadValidator()]],
    });
  }

  openCreate(): void {
    this.createForm.reset({
      usuario: '',
      email: '',
      password: '',
      nombreCompleto: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: null,
    });
    this.showCreateDialog.set(true);
  }

  createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    const fechaNacimiento =
      raw.fechaNacimiento instanceof Date
        ? raw.fechaNacimiento.toISOString()
        : new Date().toISOString();
    if (this.data.getUserByUsuario(raw.usuario)) {
      this.message.add({ severity: 'warn', summary: 'Usuario ya existe' });
      return;
    }
    this.data.createUser({
      usuario: raw.usuario.trim(),
      email: raw.email.trim(),
      password: raw.password,
      nombreCompleto: raw.nombreCompleto.trim(),
      direccion: raw.direccion.trim(),
      telefono: raw.telefono.trim(),
      fechaNacimiento,
      permissions: [],
      groupIds: [],
    });
    this.showCreateDialog.set(false);
    this.message.add({ severity: 'success', summary: 'Usuario creado' });
  }

  openPerms(userId: string): void {
    const user = this.data.getUserById(userId);
    if (!user) return;
    const controls: Record<string, [boolean]> = {};
    this.permissionList.forEach((p) => {
      controls[p] = [user.permissions.includes(p)];
    });
    this.permsForm = this.fb.group(controls);
    this.editingUserId.set(userId);
    this.showPermsDialog.set(true);
  }

  savePerms(): void {
    const uid = this.editingUserId();
    const form = this.permsForm;
    if (!uid || !form) return;
    const perms = this.permissionList.filter((p) => form.get(p)?.value);
    this.data.updateUser(uid, { permissions: perms });
    this.showPermsDialog.set(false);
    this.editingUserId.set(null);
    this.message.add({ severity: 'success', summary: 'Permisos actualizados' });
  }

  deleteUser(userId: string): void {
    if (userId === this.currentUserId()) {
      this.message.add({ severity: 'warn', summary: 'No puedes eliminarte a ti mismo' });
      return;
    }
    if (confirm('¿Eliminar este usuario?')) {
      this.data.deleteUser(userId);
      this.message.add({ severity: 'success', summary: 'Usuario eliminado' });
    }
  }

  back(): void {
    const gid = this.auth.currentGroupId();
    if (gid) this.router.navigate(['/grupo', gid, 'dashboard']);
    else this.router.navigate(['/grupos']);
  }
}
