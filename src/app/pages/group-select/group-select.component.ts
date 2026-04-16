import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-group-select',
  standalone: true,
  imports: [CardModule, ButtonModule, MessageModule, ToastModule],
  templateUrl: './group-select.component.html',
  styleUrl: './group-select.component.scss',
})
export class GroupSelectComponent {
  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  selectGroup(groupId: string): void {
    this.auth.selectGroup(groupId);
    this.router.navigate(['/grupo', groupId, 'dashboard']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
