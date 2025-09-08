import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';


// Inicia a aplicação usando a configuração central
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
