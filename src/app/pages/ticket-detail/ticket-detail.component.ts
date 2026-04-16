import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { Ticket, TICKET_ESTADOS, TICKET_PRIORIDADES } from '../../core/models';
import { PERMISSIONS } from '../../core/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private data = inject(DataService);
  private fb = inject(FormBuilder);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  ticketId = computed(() => this.route.snapshot.paramMap.get('ticketId') ?? '');
  ticket = computed(() => this.data.getTicketById(this.ticketId()));

  isCreator = computed(() => {
    const t = this.ticket();
    const u = this.auth.currentUser();
    return !!t && !!u && t.creadorId === u.id;
  });
  isAssignee = computed(() => {
    const t = this.ticket();
    const u = this.auth.currentUser();
    return !!t && !!u && t.asignadoId === u.id;
  });
  /** Solo usuarios con permiso TICKET_EDIT (admin/super) pueden editar tickets; usuarios normales no. */
  canEditAll = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT));
  /** Cualquier miembro del grupo puede poner comentarios (aunque no pueda editar el ticket). */
  canComment = computed(() => {
    const g = this.auth.currentGroup();
    const u = this.auth.currentUser();
    return !!u && !!g && g.userIds.includes(u.id);
  });
  canAssign = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT_ASSIGN));

  commentText = signal('');
  editForm: FormGroup | null = null;
  editing = signal(false);

  estados = [...TICKET_ESTADOS];
  prioridades = [...TICKET_PRIORIDADES];
  miembros = computed(() => {
    const g = this.auth.currentGroup();
    if (!g) return [];
    return g.userIds
      .map((id) => this.data.getUserById(id))
      .filter(Boolean)
      .map((u) => ({ id: u!.id, label: u!.nombreCompleto }));
  });

  startEdit(): void {
    const t = this.ticket();
    if (!t) return;
    this.editForm = this.fb.nonNullable.group({
      titulo: [t.titulo, Validators.required],
      descripcion: [t.descripcion],
      estado: [t.estado],
      asignadoId: [t.asignadoId],
      prioridad: [t.prioridad],
      fechaLimite: [t.fechaLimite ? new Date(t.fechaLimite) : null],
    });
    this.editing.set(true);
  }

  getAssigneeName(id: string | null): string {
    if (!id) return '—';
    return this.data.getUserById(id)?.nombreCompleto ?? id;
  }

  getCreatorName(): string {
    const t = this.ticket();
    return t ? this.getAssigneeName(t.creadorId) : '—';
  }

  save(): void {
    const form = this.editForm;
    const t = this.ticket();
    const user = this.auth.currentUser();
    if (!form || !t || !user) return;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    const raw = form.getRawValue();
    const fechaLimite = raw.fechaLimite
      ? (raw.fechaLimite instanceof Date ? raw.fechaLimite.toISOString() : String(raw.fechaLimite))
      : null;
    this.data.updateTicket(
      t.id,
      {
        titulo: raw.titulo,
        descripcion: raw.descripcion,
        estado: raw.estado,
        asignadoId: raw.asignadoId,
        prioridad: raw.prioridad,
        fechaLimite,
      },
      user.id,
      user.nombreCompleto
    );
    this.editing.set(false);
    this.editForm = null;
  }

  addComment(): void {
    const text = this.commentText().trim();
    const t = this.ticket();
    const user = this.auth.currentUser();
    if (!text || !t || !user) return;
    this.data.addComment(t.id, user.id, user.nombreCompleto, text);
    this.commentText.set('');
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editForm = null;
  }

  back(): void {
    this.router.navigate(['/grupo', this.groupId(), 'dashboard']);
  }
}
