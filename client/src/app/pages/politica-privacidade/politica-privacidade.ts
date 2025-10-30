import { Component, OnInit, HostListener } from '@angular/core';
import { ViewportScroller, CommonModule } from '@angular/common';

@Component({
  selector: 'app-politica-privacidade',
  standalone: true, // 2. ADICIONE standalone: true
  imports: [CommonModule], // 3. ADICIONE O imports: [CommonModule]
  templateUrl: './politica-privacidade.html',
  styleUrls: ['./politica-privacidade.scss']
})
export class PoliticaPrivacidade implements OnInit {
  showBackToTop = false;
  activeSection = '';

  constructor(private viewportScroller: ViewportScroller) {}

  ngOnInit(): void {
    // Scroll to top on component init
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // Show/hide back to top button
    this.showBackToTop = window.pageYOffset > 300;

    // Update active section
    this.updateActiveSection();
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -200; // Offset for fixed header and nav
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  printPolicy(): void {
    window.print();
  }

  private updateActiveSection(): void {
    const sections = [
      'introducao', 'dados-coletados', 'finalidades', 'bases-legais',
      'compartilhamento', 'transferencia', 'seguranca', 'retencao',
      'cookies', 'direitos', 'menores', 'alteracoes', 'dpo',
      'contato', 'disposicoes', 'resumo'
    ];

    for (const sectionId of sections) {
      const section = document.getElementById(sectionId);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 250 && rect.bottom >= 250) {
          this.activeSection = sectionId;
          break;
        }
      }
    }
  }

  isActiveSection(sectionId: string): boolean {
    return this.activeSection === sectionId;
  }
}