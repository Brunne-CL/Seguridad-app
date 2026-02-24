import { Injectable, signal, computed } from '@angular/core';

/**
 * Credenciales hardcodeadas para validación (solo con fines educativos).
 * Usuario: admin | Contraseña: Seguridad@2025
 */
const CREDENTIALS = {
  usuario: 'admin',
  password: 'Seguridad@2025'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loggedIn = signal<boolean>(this.hasStoredSession());

  readonly isLoggedIn = computed(() => this.loggedIn());

  login(usuario: string, password: string): boolean {
    const valid =
      usuario?.trim() === CREDENTIALS.usuario &&
      password === CREDENTIALS.password;
    if (valid) {
      this.loggedIn.set(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app-seguridad-session', 'true');
      }
    }
    return valid;
  }

  logout(): void {
    this.loggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('app-seguridad-session');
    }
  }

  private hasStoredSession(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('app-seguridad-session') === 'true';
  }
}
