import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login'; // 1. Importe o LoginComponent

export const routes: Routes = [
  // 2. Adicione a rota para o login
  { path: 'login', component: LoginComponent },
  
  // 3. Adicione uma rota padrão para redirecionar para o login
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
