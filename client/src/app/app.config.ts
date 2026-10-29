import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor'; 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // As paginas publicas chegam pre-renderizadas: o Angular aproveita o HTML em vez
    // de apagar e desenhar de novo (sem piscar), e cliques antes de carregar valem.
    provideClientHydration(withEventReplay()),

    // Configura o HttpClient para usar o 'fetch' e, mais importante,
    // o nosso intercetor de autenticação para todos os pedidos.
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) // Esta linha é a correção principal
    )
  ]
};

