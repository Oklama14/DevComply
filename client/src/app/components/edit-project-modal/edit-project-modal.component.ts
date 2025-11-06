import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project } from '../../services/projects';

@Component({
  selector: 'app-edit-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-project-modal.component.html',
  styleUrls: ['./edit-project-modal.component.scss']
})
export class EditProjectModalComponent {
  @Input() project: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ nome: string; descricao: string }>();

  editedProject: { nome: string; descricao: string } = { nome: '', descricao: '' };

  ngOnChanges(): void {
    if (this.project) {
      this.editedProject = {
        nome: this.project.nome,
        descricao: this.project.descricao
      };
    }
  }

  onSave(): void {
    if (this.editedProject.nome.trim() && this.editedProject.descricao.trim()) {
      this.save.emit(this.editedProject);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  // Fecha o modal ao clicar fora do conteúdo
  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}