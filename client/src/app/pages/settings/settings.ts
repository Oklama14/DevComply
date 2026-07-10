import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { UsersService } from '../../services/users';

interface LocalSettings {
  enableAiSuggestions: boolean;
  autoSaveResponses: boolean;
  detailedReports: boolean;
  enableNotifications: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);

  settingsForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  hasGeminiKey = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      geminiApiKey: [''],
      enableAiSuggestions: [true],
      autoSaveResponses: [true],
      detailedReports: [true],
      enableNotifications: [true],
    });
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('devcomply-settings');
    if (saved) {
      try {
        this.settingsForm.patchValue(JSON.parse(saved) as LocalSettings);
      } catch {
        // ignora settings corrompidos
      }
    }
    // Estado da chave (nunca recebemos a chave em si, apenas se existe).
    this.usersService.getSettings().subscribe({
      next: (s) => (this.hasGeminiKey = s.hasGeminiKey),
      error: () => {},
    });
  }

  onSaveSettings(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { geminiApiKey, ...local } = this.settingsForm.value;
    localStorage.setItem('devcomply-settings', JSON.stringify(local));

    const key = (geminiApiKey ?? '').trim();
    if (!key) {
      this.finishSave();
      return;
    }

    this.usersService.updateGeminiKey(key).subscribe({
      next: (r) => {
        this.hasGeminiKey = r.hasGeminiKey;
        this.settingsForm.get('geminiApiKey')?.reset('');
        this.finishSave();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel salvar a chave do Gemini.';
        this.loading = false;
      },
    });
  }

  removeGeminiKey(): void {
    this.usersService.updateGeminiKey('').subscribe({
      next: (r) => {
        this.hasGeminiKey = r.hasGeminiKey;
        this.successMessage = 'Chave do Gemini removida.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => (this.errorMessage = 'Nao foi possivel remover a chave.'),
    });
  }

  private finishSave(): void {
    this.successMessage = 'Configuracoes salvas com sucesso.';
    this.loading = false;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  onResetSettings(): void {
    if (confirm('Restaurar as preferencias para o padrao?')) {
      this.settingsForm.reset({
        geminiApiKey: '',
        enableAiSuggestions: true,
        autoSaveResponses: true,
        detailedReports: true,
        enableNotifications: true,
      });
      localStorage.removeItem('devcomply-settings');
      this.successMessage = 'Preferencias restauradas.';
      setTimeout(() => (this.successMessage = ''), 3000);
    }
  }

  get f() {
    return this.settingsForm.controls;
  }
}
