import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Input({ required: true }) message!: string;
  @Input({ required: true }) type!: 'success' | 'error';
  @Input({ required: true }) show!: boolean;

  get notificationType(): 'success' | 'error' {
    return this.type || 'success';
  }

  get notificationMessage(): string {
    return this.message || '';
  }

  get isVisible(): boolean {
    return this.show || false;
  }
} 