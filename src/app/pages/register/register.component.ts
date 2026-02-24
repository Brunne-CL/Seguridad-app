import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { passwordStrengthValidator, mayorDeEdadValidator, telefonoValidator, PASSWORD_SPECIAL_CHARS } from '../../core/validators';

function confirmPasswordValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmacion')?.value;
  if (!pass || !confirm) return null;
  return pass === confirm ? null : { confirmacionNoCoincide: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    MessageModule,
    DatePickerModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: FormGroup;
  readonly specialCharsHelp = `Al menos un símbolo: ${PASSWORD_SPECIAL_CHARS}`;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {
    this.form = this.fb.nonNullable.group(
      {
        usuario: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordStrengthValidator()]],
        confirmacion: ['', Validators.required],
        nombreCompleto: ['', Validators.required],
        direccion: ['', Validators.required],
        telefono: ['', [Validators.required, telefonoValidator()]],
        fechaNacimiento: [null as Date | null, [Validators.required, mayorDeEdadValidator()]]
      },
      { validators: confirmPasswordValidator }
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Revisa que todos los campos cumplan las validaciones.'
      });
      return;
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Registro exitoso',
      detail: 'Tu cuenta ha sido creada correctamente.'
    });
    setTimeout(() => this.router.navigate(['/login']), 800);
  }
}
