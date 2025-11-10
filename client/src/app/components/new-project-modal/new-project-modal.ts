// new-project-modal.ts
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-project-modal.html',
  styleUrls: ['./new-project-modal.scss']
})
export class NewProjectModal implements OnChanges {
  @Input() id?: number | null;
  @Input() nome?: string | null;
  @Input() descricao?: string | null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ id?: number; nome: string; descricao: string }>();

  projectForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      id: [null],
      nome: ['', Validators.required],
      descricao: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // whenever inputs change, patch defaults
    const patch: any = {};
    if ('id' in changes) patch.id = this.id ?? null;
    if ('nome' in changes) patch.nome = this.nome ?? '';
    if ('descricao' in changes) patch.descricao = this.descricao ?? '';
    this.projectForm.patchValue(patch);
  }

  closeModal() { this.close.emit(); }

  onSave() {
    if (this.projectForm.valid) {
      this.save.emit(this.projectForm.value);
    }
  }
}
