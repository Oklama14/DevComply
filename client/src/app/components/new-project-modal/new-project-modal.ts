import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-project-modal.html',
  styleUrls: ['./new-project-modal.scss']
})
export class NewProjectModal {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ nome: string; descricao: string }>();

  projectForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['']
    });
  }

  closeModal() {
    this.close.emit();
  }

  onSave() {
    if (this.projectForm.valid) {
      this.save.emit(this.projectForm.value);
    }
  }
}
