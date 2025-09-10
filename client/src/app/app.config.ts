import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor'; 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // Configura o HttpClient para usar o 'fetch' e, mais importante,
    // o nosso intercetor de autenticação para todos os pedidos.
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) // Esta linha é a correção principal
    )
  ]
};

