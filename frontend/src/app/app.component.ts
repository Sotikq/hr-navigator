import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'hr';
  user$: Observable<any>;

  currentUserJs = localStorage.getItem('currentUser');
  currentUser: any;

  constructor(private router: Router, private auth: AuthService) {
    this.user$ = this.auth.user$;

    this.auth.user$.subscribe(user => {
      this.currentUser = user;
    });
  }


  ngOnInit(): void {
    const token = this.auth.getToken();

    if (token) {
      const userFromStorage = localStorage.getItem('currentUser');

      if (userFromStorage) {
        const user = JSON.parse(userFromStorage);
        this.auth.setUser(user);
      } else {
        // fallback: если вдруг токен есть, а юзера в LS нет
        this.auth.loadUserProfile().subscribe({
          next: (user) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.auth.setUser(user);
          },
          error: (err) => {
            console.error('Не удалось загрузить пользователя при старте:', err);
            this.auth.logout(); // очищаем токен, если он невалиден
          },
        });
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToPage(page: string) {
    this.router.navigate([`/${page}`]);
  }

  goToProfile() {
    if(this.currentUser.role === 'user') {
    this.router.navigate(['/student']);
    console.log(this.currentUser.role);
    }
    else if(this.currentUser.role === 'teacher') {
      this.router.navigate(['/teacher']);
    }
  }

  check() {
    console.log(this.currentUser);
  }
}
