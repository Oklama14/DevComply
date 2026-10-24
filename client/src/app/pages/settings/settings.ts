import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../services/users';
import { AuthService } from '../../services/auth';
import { ThemeService, PreferenciaTema } from '../../services/theme';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly temas: Array<{ valor: PreferenciaTema; titulo: string; descricao: string }> = [
    { valor: 'claro', titulo: 'Claro', descricao: 'Fundo claro' },
    { valor: 'escuro', titulo: 'Escuro', descricao: 'Fundo escuro, menos brilho' },
    { valor: 'sistema', titulo: 'Automático', descricao: 'Segue o tema do seu sistema' },
  ];

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
    });
  }

  private loadSettings(): void {
    // As antigas "Preferencias" (sugestoes de IA, salvar automaticamente, relatorios
    // detalhados) nao tinham efeito e foram removidas; apaga o que ficou no navegador.
    try {
      localStorage.removeItem('devcomply-settings');
    } catch {
      // armazenamento bloqueado: nada a limpar
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

    const key = (this.settingsForm.value.geminiApiKey ?? '').trim();
    if (!key) {
      this.errorMessage = 'Digite a chave do Gemini para salvar.';
      this.loading = false;
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
    this.successMessage = 'Chave do Gemini salva.';
    this.loading = false;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  deleteAccount(): void {
    const ok = confirm(
      'Isso vai excluir sua conta e todos os seus dados (projetos, checklists e relatorios) permanentemente. Deseja continuar?',
    );
    if (!ok) return;
    this.usersService.deleteAccount().subscribe({
      next: () => this.authService.logout(),
      error: () => (this.errorMessage = 'Nao foi possivel excluir a conta.'),
    });
  }

  get f() {
    return this.settingsForm.controls;
  }
}
