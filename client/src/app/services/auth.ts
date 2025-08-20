import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base da sua API NestJS
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Salva o token no localStorage após um login bem-sucedido
        localStorage.setItem('access_token', response.access_token);
      })
    );
  }

  // (Opcional) Adicione métodos para registro, logout, etc. aqui no futuro
  // register(userInfo: any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/register`, userInfo);
  // }

  logout(): void {
    localStorage.removeItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
