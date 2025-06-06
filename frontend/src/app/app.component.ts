import { Component, OnInit, HostListener, OnDestroy, Renderer2 } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';

import { AuthService } from './services/auth.service';
import { Observable, Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'hr';
  user$: Observable<any>;

  menuOpen = false;

  currentUserJs = localStorage.getItem('currentUser');
  currentUser: any;

  private routerSubscription: Subscription;
  private scrollPosition = 0;

  constructor(private router: Router, private auth: AuthService, private renderer: Renderer2) {
    this.user$ = this.auth.user$;

    this.auth.user$.subscribe(user => {
      this.currentUser = user;
    });

    // Subscribe to router events to close mobile menu on navigation
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMenu();
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav') && !target.closest('.mobile-menu-toggle')) {
      this.closeMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth > 767 && this.menuOpen) {
      this.closeMenu();
    }
  }

  private lockScroll() {
    this.scrollPosition = window.pageYOffset;
    this.renderer.setStyle(document.body, 'position', 'fixed');
    this.renderer.setStyle(document.body, 'top', `-${this.scrollPosition}px`);
    this.renderer.setStyle(document.body, 'width', '100%');
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  private unlockScroll() {
    this.renderer.removeStyle(document.body, 'position');
    this.renderer.removeStyle(document.body, 'top');
    this.renderer.removeStyle(document.body, 'width');
    this.renderer.removeStyle(document.body, 'overflow');
    window.scrollTo(0, this.scrollPosition);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.lockScroll();
    } else {
      this.unlockScroll();
    }
  }

  private closeMenu() {
    if (this.menuOpen) {
      this.menuOpen = false;
      this.unlockScroll();
    }
  }

  isCurrentRoute(route: string): boolean {
    const currentRoute = this.router.url.split('/')[1] || '';
    return currentRoute === route;
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
  goToRegister(){
    this.router.navigate(['/register']);
  }

  goToPage(page: string) {
    this.router.navigate([`/${page}`]);
  }

  goToProfile() {
    if (this.currentUser?.role === 'user') {
      this.router.navigate(['/student']);
    } else if (this.currentUser?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (this.currentUser?.role === 'teacher') {
      this.router.navigate(['/teacher']);
    }
  }

  check() {
    console.log(this.currentUser);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.unlockScroll();
  }
}
