import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface RegisterDto { nome: string; email: string; senha: string; perfil: string; }
export interface LoginDto { email: string; senha: string; }
export interface JwtResponse { access_token: string }
export interface ApiOk { ok: boolean; message?: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {}

  // ---- helpers
  private saveToken(token: string) {
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('access_token', token);
  }
  private clearToken() {
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem('access_token');
  }

  // ---- API
register(
  userData: RegisterDto,
  opts: { autoLogin?: boolean; redirectTo?: string } = {}
): Observable<ApiOk | JwtResponse> {
  const { autoLogin = false, redirectTo = '/projects' } = opts;

  return this.http.post<ApiOk | JwtResponse>(`${this.apiUrl}/register`, userData).pipe(
    tap((res) => {
      const maybeJwt = (res as JwtResponse)?.access_token;
      if (autoLogin && maybeJwt) {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', maybeJwt);
        }
        this.router.navigate([redirectTo]);
      }
    })
  );
}

  login(credentials: LoginDto): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.saveToken(res.access_token);
      })
    );
  }

  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
