import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authToken = authService.getToken();

  // Clone a requisição e adiciona o token se existir
  let authReq = req;
  if (authToken) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
  }

  // Envia a requisição e trata erros
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se receber um erro 401 (não autorizado), faz logout e redireciona
      if (error.status === 401) {
        console.error('Token inválido ou expirado. Redirecionando para login...');
        authService.logout(); // Isso já remove o token e redireciona para /login
      }
      
      // Propaga o erro para que o componente possa tratá-lo se necessário
      return throwError(() => error);
    })
  );
};