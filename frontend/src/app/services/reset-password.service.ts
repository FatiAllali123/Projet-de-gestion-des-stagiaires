import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface VerifyTokenResponse {
  valid: boolean;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
  private apiUrl = 'http://localhost:3000/api/resetpassword';

  constructor(private http: HttpClient) {}

  // Demander la réinitialisation : envoie email avec token
  requestReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/request-reset`, { email });
  }

  // Vérifier le token envoyé dans l'URL de reset
  verifyToken(token: string): Observable<VerifyTokenResponse> {
    return this.http.get<VerifyTokenResponse>(`${this.apiUrl}/verify-token?token=${encodeURIComponent(token)}`);
  }

  // Réinitialiser le mot de passe avec token + nouveau mot de passe
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }
}
