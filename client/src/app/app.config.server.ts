import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config'; // 1. Importa a configuração principal
import { serverRoutes } from './app.routes.server';

// Esta é a configuração específica para o ambiente do servidor.
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

// 2. Mescla a configuração principal com a do servidor.
// Isto garante que o servidor tem acesso a tudo o que o cliente tem.
export const config: ApplicationConfig = mergeApplicationConfig(appConfig, serverConfig);