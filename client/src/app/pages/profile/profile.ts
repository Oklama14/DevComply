import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService, UserProfile } from '../../services/users';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  profile?: UserProfile;
  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);
  isExporting = signal(false);
  exportMsg = signal<string | null>(null);
  exportErr = signal<string | null>(null);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    perfil: [''],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadProfile();
    // Link "Como usamos seus dados" da barra lateral (/profile#seus-dados)
    this.route.fragment.subscribe((f) => {
      if (f) this.scrollToFragment(f);
    });
  }

  private scrollToFragment(id: string): void {
    // A pagina so renderiza depois de carregar o perfil: tenta por alguns instantes.
    let tentativas = 0;
    const tentar = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tentativas++ < 20) {
        setTimeout(tentar, 100);
      }
    };
    setTimeout(tentar);
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.msg.set(null);
    this.err.set(null);

    this.usersService
      .getMe()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.profile = res;
          this.profileForm.reset({
            nome: res.nome,
            email: res.email,
            perfil: res.perfil ?? '',
          });
        },
        error: () => this.err.set('Falha ao carregar perfil.'),
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.profile) return;

    this.isSaving.set(true);
    this.msg.set(null);
    this.err.set(null);

    this.usersService
      .updateProfile({
        nome: this.profileForm.get('nome')?.value,
        perfil: this.profileForm.get('perfil')?.value,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.msg.set('Perfil atualizado com sucesso!');
        },
        error: () => this.err.set('Nao foi possivel atualizar o perfil.'),
      });
  }

  requestPasswordChange(): void {
    if (this.passwordForm.invalid || !this.profile) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.err.set('As senhas nao coincidem.');
      return;
    }

    this.msg.set(null);
    this.err.set(null);

    this.usersService
      .changePassword({ senhaAtual: currentPassword, novaSenha: newPassword })
      .subscribe({
        next: () => {
          this.msg.set('Senha alterada com sucesso.');
          this.passwordForm.reset();
        },
        error: () => this.err.set('Falha ao alterar a senha. Verifique a senha atual.'),
      });
  }

  /** Rola ate uma secao da propria pagina (links internos). */
  irPara(id: string, event?: Event): void {
    event?.preventDefault();
    this.scrollToFragment(id);
  }

  /**
   * Portabilidade (LGPD, art. 18, II e V): baixa um JSON com tudo o que o sistema
   * guarda sobre o titular (GET /users/me/export).
   */
  exportData(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.exportMsg.set(null);
    this.exportErr.set(null);

    this.usersService
      .exportMyData()
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe({
        next: (dados) => {
          const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Data local (toISOString usaria UTC e viraria o dia seguinte a noite no Brasil)
          const d = new Date();
          const hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          a.download = `devcomply-meus-dados-${hoje}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.exportMsg.set('Arquivo gerado. O download foi iniciado.');
        },
        error: () => this.exportErr.set('Nao foi possivel gerar o arquivo. Tente novamente.'),
      });
  }

  /** Exclui a conta (LGPD, art. 18, VI) — mesmo fluxo da Zona de perigo em Configuracoes. */
  deleteAccount(): void {
    if (this.isDeleting()) return;
    const ok = confirm(
      'Isso vai excluir sua conta e todos os seus dados (projetos, checklists e relatorios) permanentemente. Deseja continuar?',
    );
    if (!ok) return;

    this.msg.set(null);
    this.err.set(null);
    this.isDeleting.set(true);

    this.usersService
      .deleteAccount()
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => this.authService.logout(),
        error: () => this.err.set('Nao foi possivel excluir a conta.'),
      });
  }
}
