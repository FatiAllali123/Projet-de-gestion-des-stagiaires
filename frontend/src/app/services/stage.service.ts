import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour le typage
export interface Stage {
  id: number;
  sujet_stage: string;
  date_debut: string;
  date_fin: string;
  statut_stage: 'Planifié' | 'En cours' | 'Terminé';
  Stagiaire_id: number;
  encadrant_id?: number;
  candidature_id: number;
  Stagiaire?: {
    id: number;
    nom: string;
    prenom: string;
  };
  Encadrant?: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
  };
    Candidature?: {
    id: number;
    Offre?: {
      mode_stage: string;
      type_stage: string;
    };
  };
   Evaluation?: any;
}

export interface CreerStageRequest {
  sujet_stage: string;
  date_debut: string;
  date_fin: string;
  candidature_id: number;
}

export interface AffecterEncadrantRequest {
  encadrantId: number;
}

export interface ChangerEncadrantRequest {
  nouveauEncadrantId: number;
}

export interface StageActifResponse {
  hasActiveStage: boolean;
  stages?: Array<{
    id: number;
    date_debut: string;
    date_fin: string;
    statut: 'Planifié' | 'En cours';
  }>;
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StageService {
  private apiUrl = 'http://localhost:3000/api/stages'; // Base URL correspondant à app.js

  constructor(private http: HttpClient) { }

  // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  /**
   * Crée un nouveau stage
   */
  creerStage(data: CreerStageRequest): Observable<{
    message: string;
    stage: {
      id: number;
      sujet_stage: string;
      date_debut: string;
      date_fin: string;
      statut_stage: 'Planifié' | 'En cours';
    };
  }> {
    return this.http.post<{
      message: string;
      stage: {
        id: number;
        sujet_stage: string;
        date_debut: string;
        date_fin: string;
        statut_stage: 'Planifié' | 'En cours';
      };
    }>(`${this.apiUrl}/new`, data , { headers: this.getHeaders() });
  }

  getStageDetails(stageId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/${stageId}`, { headers: this.getHeaders() });
}

  /**
   * Affecte un encadrant à un stage
   */
  affecterEncadrant(stageId: number, encadrantId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/${stageId}/AffecterEncadrant`,
      { encadrantId },{ headers: this.getHeaders() }
    );
  }

  /**
   * Change l'encadrant d'un stage
   */
  changerEncadrant(stageId: number, nouveauEncadrantId: number): Observable<{
    message: string;
    ancienEncadrant?: { id: number; nom: string; prenom: string };
    nouveauEncadrant: { id: number; nom: string; prenom: string };
  }> {
    return this.http.put<{
      message: string;
      ancienEncadrant?: { id: number; nom: string; prenom: string };
      nouveauEncadrant: { id: number; nom: string; prenom: string };
    }>(`${this.apiUrl}/${stageId}/changer-encadrant`, { nouveauEncadrantId },{ headers: this.getHeaders() });
  }

  /**
   * Récupère les stages actifs (en cours ou planifiés)
   */
  getStagesActifs(): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.apiUrl}/`,{ headers: this.getHeaders() });
  }

  /**
   * Récupère l'historique des stages terminés
   */
  getHistoriqueStages(): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.apiUrl}/historique`,{ headers: this.getHeaders() });
  }

  /**
   * Vérifie si un candidat a un stage actif
   */
  checkActiveStage(candidatId: number): Observable<StageActifResponse> {
    return this.http.get<StageActifResponse>(`${this.apiUrl}/check-active/${candidatId}`,{ headers: this.getHeaders() });
  }

  /**
   * Récupère les stages d'un encadrant (pour RH/Admin)
   */
  getStagesEncadrant(encadrantId: number, statut?: string): Observable<Stage[]> {
    let url = `${this.apiUrl}/encadrants/${encadrantId}/stages`;
    if (statut) {
      url += `?statut=${statut}`;
    }
    return this.http.get<Stage[]>(url,{ headers: this.getHeaders() });
  }

  /**
   * Récupère les stages de l'encadrant connecté
   */
  getMesStagesEncadrant(statut?: string): Observable<Stage[]> {
    let url = `${this.apiUrl}/encadrants/mes-stages`;
    if (statut) {
      url += `?statut=${statut}`;
    }
    return this.http.get<Stage[]>(url,{ headers: this.getHeaders() });
  }

  /**
   * Récupère les stages du stagiaire connecté
   */
  getMesStagesStagiaire(statut?: string): Observable<Stage[]> {
    let url = `${this.apiUrl}/mes-stages`;
    if (statut) {
      url += `?statut=${statut}`;
    }
    return this.http.get<Stage[]>(url,{ headers: this.getHeaders() });
  }


   getStagesForEvaluation(): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.apiUrl}/stages/evaluation-pending`  ,{ headers: this.getHeaders() });
  }
}