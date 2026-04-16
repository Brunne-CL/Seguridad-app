import { Component, computed, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { mayorDeEdadValidator, telefonoValidator } from '../../core/validators';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  editing = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombreCompleto: ['', Validators.required],
    direccion: [''],
    telefono: ['', [telefonoValidator()]],
    fechaNacimiento: ['', [Validators.required, mayorDeEdadValidator()]],
  });

  user = computed(() => this.auth.currentUser());

  constructor() {
    effect(() => {
      const u = this.user();
      if (u && !this.editing()) this.syncFormFromUser(u);
    });
  }

  private syncFormFromUser(u: { email: string; nombreCompleto: string; direccion: string; telefono: string; fechaNacimiento: string }): void {
    const iso = u.fechaNacimiento?.slice(0, 10) ?? '';
    this.form.patchValue({
      email: u.email ?? '',
      nombreCompleto: u.nombreCompleto ?? '',
      direccion: u.direccion ?? '',
      telefono: u.telefono ?? '',
      fechaNacimiento: iso,
    }, { emitEvent: false });
  }

  startEdit(): void {
    const u = this.user();
    if (u) {
      this.syncFormFromUser(u);
      this.editing.set(true);
    }
  }

  restablecer(): void {
    const u = this.user();
    if (u) this.syncFormFromUser(u);
  }

  guardar(): void {
    const u = this.user();
    if (!u || this.form.invalid) return;
    const raw = this.form.getRawValue();
    const fechaNacimiento = raw.fechaNacimiento
      ? new Date(raw.fechaNacimiento + 'T12:00:00').toISOString()
      : u.fechaNacimiento;
    this.data.updateUser(u.id, {
      email: raw.email?.trim() ?? u.email,
      nombreCompleto: raw.nombreCompleto?.trim() ?? u.nombreCompleto,
      direccion: raw.direccion?.trim() ?? u.direccion,
      telefono: raw.telefono?.trim() ?? u.telefono,
      fechaNacimiento,
    });
    this.editing.set(false);
  }

  cancelarEdicion(): void {
    this.restablecer();
    this.editing.set(false);
  }

  assignedTickets = computed(() => {
    const u = this.user();
    if (!u) return [];
    const groups = u.groupIds;
    let list: { id: string; titulo: string; estado: string; groupId: string }[] = [];
    groups.forEach((gid) => {
      this.data.getTicketsByGroupId(gid).forEach((t) => {
        if (t.asignadoId === u.id) {
          list.push({ id: t.id, titulo: t.titulo, estado: t.estado, groupId: gid });
        }
      });
    });
    return list;
  });
  resumen = computed(() => {
    const list = this.assignedTickets();
    return {
      abiertos: list.filter((t) => t.estado !== 'Hecho').length,
      enProgreso: list.filter((t) => t.estado === 'En progreso' || t.estado === 'Revisión').length,
      hechos: list.filter((t) => t.estado === 'Hecho').length,
    };
  });

  goTicket(ticketId: string, groupId: string): void {
    this.router.navigate(['/grupo', groupId, 'ticket', ticketId]);
  }

  goBack(): void {
    const gid = this.auth.currentGroupId();
    if (gid) this.router.navigate(['/grupo', gid, 'dashboard']);
    else this.router.navigate(['/grupos']);
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
