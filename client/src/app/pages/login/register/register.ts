import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

function passwordMatch(c: AbstractControl): ValidationErrors | null {
  const p = c.get('senha')?.value;
  const cp = c.get('confirmSenha')?.value;
  return p && cp && p !== cp ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';

  form!: FormGroup;

  // ✅ injeta fb/auth/router
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        perfil: ['desenvolvedor', [Validators.required]], // obrigatório p/ backend
        senha: ['', [Validators.required, Validators.minLength(6)]],
        confirmSenha: ['', [Validators.required]],
      },
      { validators: passwordMatch }
    );
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, email, senha, perfil } = this.form.value;
    this.loading = true;

    this.auth.register(
      { nome: nome!.trim(), email: email!.trim(), senha: senha!, perfil: perfil! },
      { autoLogin: false } // se o backend retornar token, pode usar autoLogin:true
    ).subscribe({
      next: () => {
        this.successMessage = 'Conta criada com sucesso! Você já pode entrar.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Não foi possível criar sua conta.';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
}
