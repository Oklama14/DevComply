import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  // Variável para saber se estamos no navegador
  private isBrowser: boolean;

  constructor(private http: HttpClient) {
    // Injetamos o PLATFORM_ID para verificar o ambiente de execução
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

  login(credentials: any): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Só salvamos no localStorage se estivermos no navegador
        if (this.isBrowser) {
          localStorage.setItem('access_token', response.access_token);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('access_token');
    }
    return null; // Retorna null se estiver no servidor
  }

  isLoggedIn(): boolean {
    // Esta verificação agora é segura para rodar no servidor
    return !!this.getToken();
  }
}
