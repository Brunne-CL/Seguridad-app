import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    SelectModule,
    ToastModule,
  ],
  templateUrl: './group-management.component.html',
  styleUrl: './group-management.component.scss',
})
export class GroupManagementComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private message = inject(MessageService);
  private fb = inject(FormBuilder);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  group = computed(() => this.auth.currentGroup());
  members = computed(() => {
    const g = this.group();
    if (!g) return [];
    return g.userIds
      .map((id) => this.data.getUserById(id))
      .filter(Boolean)
      .map((u) => ({ id: u!.id, usuario: u!.usuario, email: u!.email, nombreCompleto: u!.nombreCompleto }));
  });

  /** Usuarios que aún no están en el grupo (para el select). */
  usersNotInGroup = computed(() => {
    const g = this.group();
    if (!g) return [];
    const all = this.data.users();
    return all.filter((u) => !g.userIds.includes(u.id)).map((u) => ({
      id: u.id,
      label: `${u.nombreCompleto} (${u.email})`,
    }));
  });

  newNombre = signal('');
  addUserForm = this.fb.nonNullable.group({ userId: [null as string | null] });

  canEdit = computed(() => this.auth.hasPermission('group:edit' as never));
  canDelete = computed(() => this.auth.hasPermission('group:delete' as never));
  canAdd = computed(() => this.auth.hasPermission('group:add' as never));

  saveNombre(): void {
    const nombre = this.newNombre().trim();
    const g = this.group();
    if (!nombre || !g || !this.canEdit()) return;
    this.data.updateGroup(g.id, { nombre });
    this.newNombre.set('');
    this.message.add({ severity: 'success', summary: 'Nombre actualizado' });
  }

  addSelectedUser(): void {
    const userId = this.addUserForm.getRawValue().userId;
    const g = this.group();
    if (!userId || !g || !this.canAdd()) return;
    this.data.addUserToGroup(g.id, userId);
    this.addUserForm.reset({ userId: null });
    this.message.add({ severity: 'success', summary: 'Usuario añadido al grupo' });
  }

  removeUser(userId: string): void {
    const g = this.group();
    if (!g || !this.canDelete()) return;
    this.data.removeUserFromGroup(g.id, userId);
    this.message.add({ severity: 'success', summary: 'Usuario eliminado del grupo' });
  }

  back(): void {
    this.router.navigate(['/grupo', this.groupId(), 'dashboard']);
  }
}
