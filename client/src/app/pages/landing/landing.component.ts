// src/app/pages/landing/landing.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  
  features = [
    {
      icon: 'checklist',
      title: 'Checklist Interativo LGPD',
      description: 'Lista detalhada de requisitos específicos para desenvolvedores com orientações técnicas práticas.'
    },
    {
      icon: 'analytics',
      title: 'Análise de Conformidade Automatizada',
      description: 'Avaliação inteligente das implementações com recomendações técnicas específicas usando IA.'
    },
    {
      icon: 'report',
      title: 'Relatórios Personalizados',
      description: 'Geração automática de relatórios de conformidade com identificação de lacunas e soluções.'
    },
    {
      icon: 'security',
      title: 'Privacy by Design & Default',
      description: 'Implementação dos princípios de privacidade desde a concepção do sistema.'
    }
  ];

  benefits = [
    'Redução de riscos de multas e penalidades da LGPD',
    'Economia de tempo na implementação da conformidade',
    'Integração entre equipes jurídicas e técnicas',
    'Relatórios detalhados para auditorias',
    'Orientação prática para desenvolvedores'
  ];

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}