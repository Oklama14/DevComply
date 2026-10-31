// src/app/pages/landing/landing.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PERGUNTAS_FREQUENTES } from './landing.content';

/**
 * Pagina inicial publica, pre-renderizada no build. Os botoes sao links (routerLink),
 * e nao (click): link e o que o buscador segue e o que abre em nova aba.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  readonly perguntas = PERGUNTAS_FREQUENTES;
  readonly ano = new Date().getFullYear();
}
