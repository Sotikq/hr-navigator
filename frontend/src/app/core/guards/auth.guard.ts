import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Проверяем наличие токена
  const token = authService.getToken();
  
  // Проверяем наличие пользователя в localStorage
  const currentUser = localStorage.getItem('currentUser');
  
  // Проверяем пользователя в BehaviorSubject
  const user = await firstValueFrom(authService.user$);

  // Если токен есть и пользователь есть (либо в localStorage, либо в BehaviorSubject)
  if (token && (currentUser || user)) {
    // Если пользователь есть в localStorage, но нет в BehaviorSubject - синхронизируем
    if (currentUser && !user) {
      try {
        const parsedUser = JSON.parse(currentUser);
        authService.setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        // Очищаем поврежденные данные
        localStorage.removeItem('currentUser');
        authService.logout();
        router.navigate(['/login']);
        return false;
      }
    }
    
    return true;
  }

  // Если нет авторизации - очищаем все данные и перенаправляем на логин
  console.log('User not authenticated, redirecting to login...');
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  authService.setUser(null);
  router.navigate(['/login']);
  return false;
}; 