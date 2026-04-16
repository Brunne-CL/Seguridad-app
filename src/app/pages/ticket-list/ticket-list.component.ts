import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { Ticket, TICKET_ESTADOS, TICKET_PRIORIDADES } from '../../core/models';
import { PERMISSIONS } from '../../core/models';
import { QuickFiltersComponent, type QuickFilterValue } from '../quick-filters/quick-filters.component';
import { KanbanComponent } from '../kanban/kanban.component';

export type TicketViewMode = 'list' | 'kanban';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    DatePipe,
    QuickFiltersComponent,
    KanbanComponent,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  viewMode = signal<TicketViewMode>('list');
  viewModeOptions: { label: string; value: TicketViewMode }[] = [
    { label: 'Lista', value: 'list' },
    { label: 'Kanban', value: 'kanban' },
  ];
  quickFilter = signal<QuickFilterValue>('all');
  filterForm = this.fb.nonNullable.group({
    estado: [null as string | null],
    prioridad: [null as string | null],
    asignado: [null as string | null],
    global: [''],
  });
  filterValue = toSignal(this.filterForm.valueChanges, {
    initialValue: this.filterForm.getRawValue(),
  });

  tickets = computed(() => {
    let list = this.data.getTicketsByGroupId(this.groupId());
    const qf = this.quickFilter();
    const userId = this.auth.currentUser()?.id;
    if (qf === 'mine' && userId) list = list.filter((t) => t.asignadoId === userId);
    else if (qf === 'unassigned') list = list.filter((t) => !t.asignadoId);
    else if (qf === 'high') list = list.filter((t) => t.prioridad === 'Alta');
    const f = this.filterValue() ?? this.filterForm.getRawValue();
    const g = (f.global ?? '')?.toLowerCase() ?? '';
    if (f.estado) list = list.filter((t) => t.estado === f.estado);
    if (f.prioridad) list = list.filter((t) => t.prioridad === f.prioridad);
    if (f.asignado) list = list.filter((t) => t.asignadoId === f.asignado);
    if (g) list = list.filter((t) => t.titulo.toLowerCase().includes(g) || (t.descripcion?.toLowerCase().includes(g)));
    return list;
  });

  estados = [...TICKET_ESTADOS];
  prioridades = [...TICKET_PRIORIDADES];
  miembros = computed(() => {
    const g = this.auth.currentGroup();
    if (!g) return [];
    return g.userIds.map((id) => this.data.getUserById(id)).filter(Boolean) as { id: string; nombreCompleto: string }[];
  });

  canCreate = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_ADD));

  setQuickFilter(f: QuickFilterValue): void {
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
