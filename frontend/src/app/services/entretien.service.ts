import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Entretien {
  id: number;
  candidature_id: number;
  date_entretien: string;
  heure_entretien: string;
  statut: 'Planifié' | 'Annulé' | 'Passé';
  resultat: string | null;
}

export interface PlanifierEntretienData {
  date_entretien: string;
  heure_entretien: string;
}

export interface ModifierEntretienData {
  date_entretien: string;
  heure_entretien: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntretienService {
  private apiUrl = 'http://localhost:3000/api/entretiens'; // Base URL correspondant à app.js

  constructor(private http: HttpClient) { }

    // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }


  /**
   * Planifie un nouvel entretien pour une candidature
   * @param candidatureId ID de la candidature
   * @param data Données de planification
   */
  planifierEntretien(candidatureId: number, data: PlanifierEntretienData): Observable<{
    success: boolean;
    message: string;
    entretien: Entretien;
  }> {
    console.log('Envoi au serveur - ID:', candidatureId, 'Data:', data);
    return this.http.post<{
      success: boolean;
      message: string;
      entretien: Entretien;
    }>(`${this.apiUrl}/candidature/${candidatureId}/planifier`, data , { headers: this.getHeaders() });
  }

  /**
   * Modifie la date/heure d'un entretien existant
   * @param entretienId ID de l'entretien
   * @param data Nouvelles données
   */
  modifierEntretien(entretienId: number, data: ModifierEntretienData): Observable<{
    success: boolean;
    message: string;
    entretien: Entretien;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      entretien: Entretien;
    }>(`${this.apiUrl}/${entretienId}/modifier`, data,{ headers: this.getHeaders() });
  }

  /**
   * Annule un entretien planifié
   * @param entretienId ID de l'entretien
   */
  annulerEntretien(entretienId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${entretienId}/annuler`, {},{ headers: this.getHeaders() });
  }

  /**
   * Marque un entretien comme terminé
   * @param entretienId ID de l'entretien
   */
  terminerEntretien(entretienId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${entretienId}/terminer`, {} , { headers: this.getHeaders() });
  }
}