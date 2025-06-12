// token.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const tokenInterceptorFn: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  
  // Добавляем токен к запросу если он есть
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Если получили 401 ошибку - токен недействителен
      if (error.status === 401) {
        console.log('Token expired or invalid, redirecting to login...');
        
        // Очищаем все данные авторизации
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        auth.setUser(null);
        
        // Перенаправляем на логин, если мы не на странице логина
        if (!router.url.includes('/login')) {
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};
