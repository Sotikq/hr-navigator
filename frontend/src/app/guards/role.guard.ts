import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

export const roleGuard = (allowedRoles: string[]) => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = await firstValueFrom(authService.user$);
    
    // Проверяем, авторизован ли пользователь
    if (!user) {
      return router.parseUrl('/login');
    }

    // Проверяем, есть ли у пользователя нужная роль
    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // Если роль не подходит, перенаправляем на соответствующую страницу профиля
    switch (user.role) {
      case 'student':
        return router.parseUrl('/student');
      case 'teacher':
        return router.parseUrl('/teacher');
      case 'admin':
        return router.parseUrl('/admin');
      default:
        return router.parseUrl('/');
    }
  };
}; 