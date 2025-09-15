import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // <-- aqui
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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    console.log("O método onSubmit foi chamado!"); // Para depuração, consegue ver laa no f12 -> console
    if (this.loginForm.invalid) {
      this.errorMessage = "Por favor, preencha todos os campos corretamente.";
      return;
    }

    this.errorMessage = null;
    const { email, senha } = this.loginForm.value;

    this.authService.login({ email, senha }).subscribe({
      next: (response) => {
        console.log("Login bem-sucedido", response);
        this.router.navigate(['/dashboard']); // Navega para o dashboard
      },
      error: (err) => {
        console.error("Erro de login:", err);
        this.errorMessage = "Email ou senha inválidos. Por favor, tente novamente.";
      }
    });
  }
}
