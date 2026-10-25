import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}
export interface UpdateProfilePayload {
  nome?: string;
  perfil?: string;
}
export interface ChangePasswordPayload {
  senhaAtual: string;
  novaSenha: string;
}
export interface UserSettings {
  hasGeminiKey: boolean;
  /** Quando a chave foi salva sem o Google conseguir confirmar. */
  aviso?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me/profile`, payload);
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, payload);
  }

  getSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.apiUrl}/me/settings`);
  }

  updateGeminiKey(geminiApiKey: string): Observable<UserSettings> {
    return this.http.patch<UserSettings>(`${this.apiUrl}/me/gemini-key`, {
      geminiApiKey,
    });
  }

  /** Portabilidade (LGPD, art. 18, II e V): tudo o que o sistema guarda sobre o titular. */
  exportMyData(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/me/export`);
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me`);
  }
}
