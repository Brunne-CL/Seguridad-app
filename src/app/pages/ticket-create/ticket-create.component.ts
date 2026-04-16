import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { TICKET_ESTADOS, TICKET_PRIORIDADES } from '../../core/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss',
})
export class TicketCreateComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  groupId = computed(() => this.auth.currentGroupId() ?? '');
  form: FormGroup;

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

  constructor() {
    const user = this.auth.currentUser();
    this.form = this.fb.nonNullable.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      estado: ['Pendiente', Validators.required],
      asignadoId: [user?.id ?? null],
      prioridad: ['Media', Validators.required],
      fechaLimite: [null as string | null],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser();
    if (!user) return;
    const raw = this.form.getRawValue();
    const fechaLimite = raw.fechaLimite
      ? (typeof raw.fechaLimite === 'string' ? raw.fechaLimite : (raw.fechaLimite as Date)?.toISOString?.())
      : null;
    const ticket = this.data.createTicket(this.groupId(), user.id, {
      titulo: raw.titulo,
      descripcion: raw.descripcion ?? '',
      estado: raw.estado,
      asignadoId: raw.asignadoId ?? null,
      prioridad: raw.prioridad,
      fechaLimite,
    });
    this.router.navigate(['/grupo', this.groupId(), 'ticket', ticket.id]);
  }

  cancel(): void {
    this.router.navigate(['/grupo', this.groupId(), 'dashboard']);
  }
}
