import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth'; // Importe o AuthService
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  readonly theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  /** Celular: a barra lateral vira uma gaveta aberta pelo botao de menu. */
  menuAberto = false;

  // Injeta o AuthService e o Router
  constructor(private authService: AuthService, private router: Router) {
    // Fecha a gaveta ao navegar (toque num item do menu).
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fecharMenu());
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.fecharMenu();
  }

  // Método que será chamado pelo botão de logout
  logout(): void {
    this.authService.logout();
  }
}
