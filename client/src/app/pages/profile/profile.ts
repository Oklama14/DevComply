import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { UsersService, UserProfile } from '../../services/users';

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

  profile?: UserProfile;
  isLoading = signal(false);
  isSaving = signal(false);
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
}
