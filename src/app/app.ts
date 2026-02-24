import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('app-seguridad');
  protected readonly darkMode = signal(false);

  toggleDarkMode(): void {
    this.darkMode.update((v) => !v);
    document.documentElement.classList.toggle('dark', this.darkMode());
  }
}
