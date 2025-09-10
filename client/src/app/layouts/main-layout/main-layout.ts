import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth'; // Importe o AuthService

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  // Injeta o AuthService e o Router
  constructor(private authService: AuthService, private router: Router) {}

  // Método que será chamado pelo botão de logout
  logout(): void {
    this.authService.logout();
  }
}
