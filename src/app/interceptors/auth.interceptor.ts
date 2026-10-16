import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let modifiedReq = req;
  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos 401 y no proviene de la petición de login
      if (error.status === 401 && !req.url.includes('/Auth/login')) {
        const isAdminPath =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        authService.logout(isAdminPath ? '/admin/login' : '/login');
      }
      return throwError(() => error);
    })
  );
};
