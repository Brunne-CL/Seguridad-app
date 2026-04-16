import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { TICKET_ESTADOS, PERMISSIONS } from '../../core/models';

@Component({
  selector: 'app-super-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './super-dashboard.component.html',
  styleUrl: './super-dashboard.component.scss',
})
export class SuperDashboardComponent {
  readonly TICKET_ESTADOS = TICKET_ESTADOS;
  auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  /** Grupo seleccionado en el dropdown; desde aquí se gestionan todos. */
  selectedGroupId = signal<string | null>(null);
  groupForm = this.fb.nonNullable.group({ groupId: [null as string | null] });
  /** Diálogo para crear nuevos grupos (solo super/admin). */
  showCreateGroupDialog = signal(false);
  createGroupForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });
  /** Super ve todos los grupos; admin solo los suyos. */
  groups = computed(() =>
    this.auth.isSuperUser() ? this.data.groups() : this.auth.groupsForCurrentUser()
  );

  /** Estadísticas globales para super usuario (todos los grupos y tickets). */
  allTickets = computed(() => this.data.tickets());

  globalResumen = computed(() => {
    const list = this.allTickets();
    const total = list.length;
    const porEstado: Record<string, number> = {};
    const porGrupo: Record<string, number> = {};

    TICKET_ESTADOS.forEach((e) => (porEstado[e] = 0));

    list.forEach((t) => {
      // por estado
      if (porEstado[t.estado] !== undefined) {
        porEstado[t.estado] += 1;
      } else {
        porEstado[t.estado] = 1;
      }
      // por grupo
      porGrupo[t.groupId] = (porGrupo[t.groupId] ?? 0) + 1;
    });

    return { total, porEstado, porGrupo };
  });

  selectedGroup = computed(() => {
    const id = this.selectedGroupId();
    return id ? this.data.groups().find((g) => g.id === id) ?? null : null;
  });

  constructor() {
    this.groupForm.get('groupId')?.valueChanges.subscribe((id) => {
      this.selectedGroupId.set(id ?? null);
      // Al seleccionar un grupo, ir al dashboard del grupo para que se muestre el sidebar
      if (id) {
        this.auth.selectGroup(id);
        this.router.navigate(['/grupo', id, 'dashboard']);
      }
    });
  }

  openCreateGroup(): void {
    this.createGroupForm.reset({ nombre: '' });
    this.showCreateGroupDialog.set(true);
  }

  createGroup(): void {
    if (this.createGroupForm.invalid) {
      this.createGroupForm.markAllAsTouched();
      return;
    }
    const raw = this.createGroupForm.getRawValue();
    const currentUser = this.auth.currentUser();
    const memberIds = currentUser ? [currentUser.id] : [];
    const group = this.data.createGroup(raw.nombre.trim(), memberIds);
    // seleccionar inmediatamente el nuevo grupo en el selector
    this.selectedGroupId.set(group.id);
    this.groupForm.patchValue({ groupId: group.id }, { emitEvent: true });
    this.showCreateGroupDialog.set(false);
  }

  tickets = computed(() => {
    const gid = this.selectedGroupId();
    return gid ? this.data.getTicketsByGroupId(gid) : [];
  });

  resumen = computed(() => {
    const list = this.tickets();
    const total = list.length;
    const porEstado: Record<string, number> = {};
    TICKET_ESTADOS.forEach((e) => (porEstado[e] = list.filter((t) => t.estado === e).length));
    return { total, porEstado };
  });

  getResumenCardClass(estado: string): string {
    const map: Record<string, string> = {
      'Pendiente': 'resumen-pendiente',
      'En progreso': 'resumen-en-progreso',
      'Revisión': 'resumen-revision',
      'Hecho': 'resumen-hecho',
      'Bloqueado': 'resumen-bloqueado',
    };
    return map[estado] ?? 'resumen-card';
  }

  recientesOAsignados = computed(() => {
    const list = this.tickets();
    const userId = this.auth.currentUser()?.id;
    const asignados = userId ? list.filter((t) => t.asignadoId === userId) : [];
    const recientes = [...list].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    ).slice(0, 5);
    const ids = new Set<string>();
    [...asignados, ...recientes].forEach((t) => ids.add(t.id));
    return list.filter((t) => ids.has(t.id)).slice(0, 8);
  });

  canCreateTicket = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_ADD));
  canManageGroup = computed(() => this.auth.canManageGroup());

  /** Opciones para el dropdown: super = todos los grupos, admin = solo los suyos. */
  groupOptions = computed(() =>
    this.groups().map((g) => ({ id: g.id, label: g.nombre }))
  );

  onGroupChange(id: string | null): void {
    this.groupForm.patchValue({ groupId: id ?? null }, { emitEvent: true });
  }

  enterGroup(route: string): void {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.auth.selectGroup(gid);
    this.router.navigate(['/grupo', gid, route]);
  }

  goCrearTicket(): void {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.auth.selectGroup(gid);
    this.router.navigate(['/grupo', gid, 'ticket', 'nuevo']);
  }

  goTicket(id: string): void {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.auth.selectGroup(gid);
    this.router.navigate(['/grupo', gid, 'ticket', id]);
  }

  goPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  goUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getAssigneeName(ticket: { asignadoId: string | null }): string {
    if (!ticket.asignadoId) return '—';
    return this.data.getUserById(ticket.asignadoId)?.nombreCompleto ?? ticket.asignadoId;
  }

  getSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      Pendiente: 'secondary',
      'En progreso': 'info',
      Revisión: 'warn',
      Hecho: 'success',
      Bloqueado: 'danger',
    };
    return map[estado] ?? 'secondary';
  }
}
