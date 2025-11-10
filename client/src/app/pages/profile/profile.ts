import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

type Profile = {
  id: number;
  nome: string;
  email: string;
  perfil: string; // occupation / role
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  profile?: Profile;
  isLoading = signal(false);
  isSaving = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  // editable fields (name, perfil). Email read-only, but easy to switch
  profileForm: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    perfil: [''] // occupation
  });

  // password request form (simple request/trigger)
  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['',[Validators.required]],
    newPassword: ['',[Validators.required, Validators.minLength(8)]],
    confirmPassword: ['',[Validators.required]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.msg.set(null);
    this.err.set(null);

    // adjust endpoint to your API
    this.http.get<Profile>('/api/users/me')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.profile = res;
          this.profileForm.reset({
            nome: res.nome,
            email: res.email,
            perfil: res.perfil ?? ''
          });
        },
        error: (e) => this.err.set('Falha ao carregar perfil.')
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.profile) return;

    this.isSaving.set(true);
    this.msg.set(null);
    this.err.set(null);

    // enable email temporarily if you want to send it too
    const payload = {
      nome: this.profileForm.get('nome')?.value,
      perfil: this.profileForm.get('perfil')?.value
      // email: this.profileForm.get('email')?.value, // if editable
    };

    this.http.patch<Profile>(`/api/users/${this.profile.id}`, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.msg.set('Perfil atualizado com sucesso!');
        },
        error: () => this.err.set('Não foi possível atualizar o perfil.')
      });
  }

  requestPasswordChange(): void {
    if (this.passwordForm.invalid || !this.profile) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.err.set('As senhas não coincidem.');
      return;
    }

    this.msg.set(null);
    this.err.set(null);

    this.http.post(`/api/users/${this.profile.id}/change-password`, {
      currentPassword,
      newPassword
    }).subscribe({
      next: () => {
        this.msg.set('Senha alterada com sucesso.');
        this.passwordForm.reset();
      },
      error: () => this.err.set('Falha ao alterar a senha. Verifique a senha atual.')
    });
  }
}
