import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
  specialite_encadrant?: string;
  statut_compte?: string;
  created_at?: string;
  etablissement?:string;
  niveau_etudes ?: string ;
  telephone?: string ;
  
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private apiUrl = 'http://localhost:3000/api/utilisateurs';

  constructor(private http: HttpClient) {}

  // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // === Méthodes publiques (sans token) ===
  createUser(userData: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, userData);
  }

  // === Méthodes protégées (avec token) ===
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateUser(id: number, updateData: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, updateData, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Admin seulement
  createStaffAccount(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/staff/create-account`, data, { headers: this.getHeaders() });
  }

  /*listStaffAccounts(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/staff`, { headers: this.getHeaders() });
  }*/



listStaffAccounts(role?: string): Observable<any> {
  const params = role ? new HttpParams().set('role', role) : new HttpParams();
  return this.http.get(`${this.apiUrl}/admin/staff`, {
    headers: this.getHeaders(),
    params: params
  });
}

  manageStaffAccount(id: number, action: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/staff/${id}`, { action }, { headers: this.getHeaders() });
  }

  // Profil utilisateur connecté
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profil`, { headers: this.getHeaders() });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profil`, data, { headers: this.getHeaders() });
  }

  changePassword(data: { ancien_mot_de_pass: string; nouveau_mot_de_pass: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/changer-password`, data, { headers: this.getHeaders() });
  }

  getEncadrants(search?: string): Observable<User[]> {
    let url = `${this.apiUrl}/encadrants`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    return this.http.get<User[]>(url, { headers: this.getHeaders() });
  }
}