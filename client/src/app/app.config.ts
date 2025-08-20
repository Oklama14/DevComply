import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // A configuração da Zone.js deve estar aqui
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideRouter(routes),
    provideHttpClient()
  ]
};
