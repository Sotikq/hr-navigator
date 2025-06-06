// api.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environment';

export const ApiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const apiKey = environment.apiKey;

  // Clone request and add headers
  const modifiedReq = req.clone({
    setHeaders: {
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return next(modifiedReq);
};