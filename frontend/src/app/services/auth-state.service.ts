import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private showLoginSuccess = new BehaviorSubject<boolean>(false);
  showLoginSuccess$ = this.showLoginSuccess.asObservable();

  setLoginSuccess(value: boolean) {
    this.showLoginSuccess.next(value);
  }
} 