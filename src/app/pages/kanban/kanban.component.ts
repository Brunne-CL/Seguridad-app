import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { Ticket, TICKET_ESTADOS, type TicketEstado } from '../../core/models';
import { PERMISSIONS } from '../../core/models';
import { QuickFiltersComponent } from '../quick-filters/quick-filters.component';

type QuickFilter = 'all' | 'mine' | 'unassigned' | 'high';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule, DatePipe, NgClass, QuickFiltersComponent],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
})
export class KanbanComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);

  /** Si false, no se muestra el encabezado (título, filtros, crear). Útil cuando se embebe en lista. */
  showHeader = input<boolean>(true);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  quickFilter = signal<QuickFilter>('all');

  tickets = computed(() => {
    let list = this.data.getTicketsByGroupId(this.groupId());
    const filter = this.quickFilter();
    const userId = this.auth.currentUser()?.id;
    if (filter === 'mine' && userId) list = list.filter((t) => t.asignadoId === userId);
    else if (filter === 'unassigned') list = list.filter((t) => !t.asignadoId);
    else if (filter === 'high') list = list.filter((t) => t.prioridad === 'Alta');
    return list;
  });

  columns = computed(() =>
    TICKET_ESTADOS.map((estado) => ({
      estado,
      tickets: this.tickets().filter((t) => t.estado === estado),
      count: this.tickets().filter((t) => t.estado === estado).length,
    }))
  );

  canCreate = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_ADD));
  /** Solo usuarios con permiso específico de cambiar estado pueden arrastrar/soltar en el Kanban. */
  canChangeEstado = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT_STATE));

  canDrag(ticket: Ticket): boolean {
    if (!this.canChangeEstado()) return false;
    const user = this.auth.currentUser();
    if (!user) return false;
    return ticket.asignadoId === user.id;
  }

  getColumnClass(estado: string): string {
    const map: Record<string, string> = {
      'Pendiente': 'pendiente',
      'En progreso': 'en-progreso',
      'Revisión': 'revision',
      'Hecho': 'hecho',
      'Bloqueado': 'bloqueado',
    };
    return map[estado] ?? 'pendiente';
  }

  setFilter(f: QuickFilter): void {
    this.quickFilter.set(f);
  }

  getAssigneeName(ticket: Ticket): string {
    if (!ticket.asignadoId) return '—';
    return this.data.getUserById(ticket.asignadoId)?.nombreCompleto ?? ticket.asignadoId;
  }

  goTicket(id: string): void {
    this.router.navigate(['/grupo', this.groupId(), 'ticket', id]);
  }

  goCrear(): void {
    this.router.navigate(['/grupo', this.groupId(), 'ticket', 'nuevo']);
  }

  onDragStart(e: DragEvent, ticket: Ticket): void {
    e.dataTransfer!.setData('text/plain', ticket.id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  onDrop(e: DragEvent, estado: TicketEstado): void {
    e.preventDefault();
    if (!this.canChangeEstado()) return;
    const id = e.dataTransfer?.getData('text/plain');
    if (!id) return;
    const user = this.auth.currentUser();
    if (!user) return;
    const ticket = this.data.getTicketById(id);
    if (!ticket || ticket.asignadoId !== user.id) return;
    this.data.setTicketEstado(id, estado, user.id, user.nombreCompleto);
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
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
