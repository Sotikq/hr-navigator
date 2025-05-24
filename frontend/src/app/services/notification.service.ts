import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notification = new BehaviorSubject<Notification>({
    message: '',
    type: 'success',
    show: false
  });

  private hideTimeout: any;

  notification$ = this.notification.asObservable();

  showSuccess(message: string) {
    this.clearHideTimeout();
    this.notification.next({
      message,
      type: 'success',
      show: true
    });

    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  }

  showError(message: string) {
    this.clearHideTimeout();
    this.notification.next({
      message,
      type: 'error',
      show: true
    });

    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  }

  hide() {
    this.clearHideTimeout();
    this.notification.next({
      ...this.notification.value,
      show: false
    });
  }

  private clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
} 