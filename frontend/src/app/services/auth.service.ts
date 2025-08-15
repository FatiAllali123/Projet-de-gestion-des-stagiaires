import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
interface UserResponse {
  success: boolean;
  role: string;
  statut: string;
  id: number;
  message?: string; // pour les erreurs
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

    // Suivi de l'état d'authentification
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  authStatus$ = this.authStatusSubject.asObservable();
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient , private router : Router) {}

    private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  // POST /login
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  // POST /signup
  signup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, data);
  }

  

 
  getCurrentUser(): Observable<UserResponse> {
    const token = localStorage.getItem('token');
      return this.http.get<any>(
    'http://localhost:3000/api/auth/current-user',
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }


   logout(): void {
    // Appel au backend
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion:', err);
        this.clearAuthData();
        this.router.navigate(['/login']);
      }
    });
  }



    private clearAuthData(): void {
    localStorage.removeItem('token');
    this.authStatusSubject.next(false); // met à jour tous les abonnés
  }


}
