import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Símbolos especiales requeridos en la contraseña (al menos uno). */
export const PASSWORD_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;\':",./<>?';

/**
 * Validador: contraseña mínimo 10 caracteres y al menos un símbolo especial.
 */
export function passwordStrengthValidator(): ValidatorFn {
  const specialRegex = new RegExp(
    `[${PASSWORD_SPECIAL_CHARS.replace(/[\]\\]/g, '\\$&')}]`
  );
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string;
    if (!v) return null;
    if (v.length < 10) {
      return { passwordMinLength: { requiredLength: 10, actualLength: v.length } };
    }
    if (!specialRegex.test(v)) {
      return { passwordSpecial: { message: `Debe incluir al menos un símbolo de: ${PASSWORD_SPECIAL_CHARS}` } };
    }
    return null;
  };
}

/**
 * Validador: mayor de edad (18+ años) según fecha de nacimiento.
 */
export function mayorDeEdadValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const date = control.value as Date | string | null;
    if (!date) return null;
    const birth = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) {
      return { mayorDeEdad: { message: 'Solo se permite el registro a mayores de 18 años.' } };
    }
    return null;
  };
}

/**
 * Validador: teléfono solo números (ej. 10 dígitos).
 */
export function telefonoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string)?.replace(/\s/g, '') ?? '';
    if (!v) return null;
    if (!/^\d+$/.test(v)) {
      return { telefonoSoloNumeros: { message: 'El teléfono solo debe contener números.' } };
    }
    if (v.length < 10) {
      return { telefonoLongitud: { message: 'El teléfono debe tener al menos 10 dígitos.' } };
    }
    return null;
  };
}
