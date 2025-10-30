import { Component, OnInit, HostListener, Inject } from '@angular/core';
import { ViewportScroller, CommonModule } from '@angular/common'; // Importe o CommonModule

@Component({
  selector: 'app-termos-uso',
  standalone: true, // Adicione standalone
  imports: [CommonModule], // Adicione CommonModule para *ngIf, [class.active] etc.
  templateUrl: './termos-uso.html',
  styleUrl: './termos-uso.scss'
})
export class TermosUso implements OnInit {
  showBackToTop = false;
  activeSection = 'introducao'; // Inicia na introdução

  // Lista de todas as seções para o highlight
  private sectionIds = [
    'introducao', 'aceitacao-termos', 'descricao-servico', 'cadastro-conta',
    'uso-aceitavel', 'privacidade-dados', 'propriedade-intelectual', 
    'uso-api-terceiros', 'isencao-garantias', 'limitacao-responsabilidade',
    'modificacoes-termos', 'rescisao', 'legislacao-foro', 'disposicoes-gerais', 
    'informacoes-contato'
  ];

  constructor(private viewportScroller: ViewportScroller) {}

  ngOnInit(): void {
    // Garante que a página inicie no topo
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // Mostra/esconde o botão "Voltar ao topo"
    this.showBackToTop = window.pageYOffset > 300;

    // Atualiza a seção ativa na sidebar
    this.updateActiveSection();
  }

  /**
   * Rola a tela suavemente para uma seção, com offset
   */
  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault(); // Impede o comportamento padrão do link
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Offset para o header/nav fixo
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /**
   * Rola a tela suavemente para o topo
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Ativa a funcionalidade de impressão do navegador
   */
  printTerms(): void {
    window.print();
  }

  /**
   * Verifica qual seção está visível na tela e atualiza o estado
   */
  private updateActiveSection(): void {
    let currentSection = 'introducao';

    for (const sectionId of this.sectionIds) {
      const section = document.getElementById(sectionId);
      if (section) {
        const rect = section.getBoundingClientRect();
        // 250 é um bom threshold (altura do header + nav + margem)
        if (rect.top <= 250 && rect.bottom >= 250) { 
          currentSection = sectionId;
          break;
        }
      }
    }
    this.activeSection = currentSection;
  }

  /**
   * Helper para o template HTML verificar se a seção está ativa
   */
  isActiveSection(sectionId: string): boolean {
    return this.activeSection === sectionId;
  }
}