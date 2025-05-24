import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

export const adminGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await firstValueFrom(authService.user$);
  
  // Проверяем, авторизован ли пользователь
  if (!user) {
    return router.parseUrl('/login');
  }

  // Проверяем, является ли пользователь админом
  if (user.role === 'admin') {
    return true;
  }

  // Если не админ, перенаправляем на соответствующую страницу профиля
  switch (user.role) {
    case 'student':
      return router.parseUrl('/student');
    case 'teacher':
      return router.parseUrl('/teacher');
    default:
      return router.parseUrl('/');
  }
}; 