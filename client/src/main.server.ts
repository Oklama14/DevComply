import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

// A configuração do servidor (config) já mescla a appConfig principal.
// Ao iniciar a aplicação com ela, garantimos que o Zone.js seja incluído.
const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
