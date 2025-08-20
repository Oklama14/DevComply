    import { Component } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
    import { Router } from '@angular/router';
    import { AuthService } from '../../services/auth';

    @Component({
      selector: 'app-login',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule], // Importe o ReactiveFormsModule aqui
      templateUrl: './login.html',
      styleUrls: ['./login.scss']
    })
    export class LoginComponent {
      loginForm: FormGroup;
      errorMessage: string | null = null;

      constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
      ) {
        // Inicializa o formulário com validações
        this.loginForm = this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          senha: ['', [Validators.required]]
        });
      }

      onSubmit(): void {
        if (this.loginForm.invalid) {
          return; // Não faz nada se o formulário for inválido
        }

        this.errorMessage = null; // Limpa mensagens de erro antigas

        this.authService.login(this.loginForm.value).subscribe({
          next: (response) => {
            console.log('Login bem-sucedido!', response);
            // Redireciona para o dashboard (criaremos essa página depois)
            // this.router.navigate(['/dashboard']); 
          },
          error: (err) => {
            console.error('Erro no login:', err);
            this.errorMessage = 'Email ou senha inválidos. Tente novamente.';
          }
        });
      }
    }