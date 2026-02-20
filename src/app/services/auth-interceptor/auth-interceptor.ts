import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth-service/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Verifica se é erro 401
      if (error.status === 401) {
        // 2. Verifica se a URL contém 'undefined' no final
        // Isso evita que o logout ocorra nessa rota específica
        const isUndefinedRoute = req.url.endsWith('/undefined');

        if (!isUndefinedRoute) {
          authService.clearToken();
          authService.clearUser();
          authService.clearLocalStorage();
          router.navigate(['/Auth/login']);
        } else {
          console.warn('Erro 401 ignorado para rota undefined:', req.url);
        }
      }

      return throwError(() => error);
    }),
  );
};
