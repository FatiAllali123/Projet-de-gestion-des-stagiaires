import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Interfaces pour le typage
export interface Absence {
  id: number;
  stage_id: number;
  date_absence: string;
  is_justified: boolean;
  justificatif_id: number | null;
}

export interface MarquerAbsenceRequest {
  stage_id: number;
  date_absence: string; // Format: 'YYYY-MM-DD'
}

export interface MarquerAbsenceResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    date: string;
    justified: boolean;
  };
}

export interface StageDetails {
  id: number;
  date_debut: string;
  date_fin: string;
  sujet_stage: string;
  statut_stage: string;
}

@Injectable({
  providedIn: 'root'
})
export class AbsenceService {
  private apiUrl = 'http://localhost:3000/api/absences'; // Base URL correspondant à app.js

  constructor(private http: HttpClient) { }

     // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Marque une absence pour un stagiaire
   * @param data Données de l'absence (stage_id + date)
   */
  marquerAbsence(data: MarquerAbsenceRequest): Observable<MarquerAbsenceResponse> {
    return this.http.post<MarquerAbsenceResponse>(
      `${this.apiUrl}/marquer`, 
      data , { headers: this.getHeaders() }
    );
  }

  /**
   * Vérifie si une date est dans la période du stage
   * (Utilisé pour la validation côté front avant envoi au backend)
   * @param stage Détails du stage
   * @param date Date à vérifier
   */
  validerDateAbsence(stage: StageDetails, date: Date): boolean {
    const dateAbs = new Date(date);
    const debutStage = new Date(stage.date_debut);
    const finStage = new Date(stage.date_fin);
    
    return dateAbs >= debutStage && dateAbs <= finStage;
  }

getAbsencesByStage(stageId: number) {
  return this.http.get<any>(`${this.apiUrl}/${stageId}/absences`,{ headers: this.getHeaders() }).pipe(
    map((response: any) => response.absences) // 👈 transforme ici
  );
}


  checkIsAbsenceJustified(absenceId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${absenceId}`);
  }

  getTraitementHistoriqueForAbsence(absenceId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/absences/${absenceId}/historique-traitement`);
}
}