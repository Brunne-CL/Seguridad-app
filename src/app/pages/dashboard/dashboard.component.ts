import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { TICKET_ESTADOS, PERMISSIONS } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, TableModule, TagModule, SelectModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly TICKET_ESTADOS = TICKET_ESTADOS;
  auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  /** Grupos a los que pertenece el usuario (para el select de cambiar de grupo). */
  myGroups = computed(() => this.auth.groupsForCurrentUser());
  groupOptions = computed(() =>
    this.myGroups().map((g) => ({ id: g.id, label: g.nombre }))
  );
  tickets = computed(() => this.data.getTicketsByGroupId(this.groupId()));

  onGroupChange(groupId: string): void {
    if (!groupId) return;
    this.auth.selectGroup(groupId);
    this.router.navigate(['/grupo', groupId, 'dashboard']);
  }

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

  goCrearTicket(): void {
    this.router.navigate(['/grupo', this.groupId(), 'ticket', 'nuevo']);
  }

  goTicket(id: string): void {
    this.router.navigate(['/grupo', this.groupId(), 'ticket', id]);
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
