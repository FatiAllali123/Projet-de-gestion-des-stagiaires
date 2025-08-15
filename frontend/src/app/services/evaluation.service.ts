import { Injectable } from '@angular/core';
import { HttpClient  ,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour le typage
export interface Evaluation {
  id: number;
  stage_id: number;
  encadrant_id: number;
  comportement: number;
  travail_equipe: number;
  qualite_travail: number;
  adaptable: number;
  commentaire?: string;
  date_evaluation: string;
  Stage?: {
    sujet_stage: string;
    Stagiaire_id: number;
  };
}

export interface CreerEvaluationRequest {
  stage_id: number;
  comportement: number;
  travail_equipe: number;
  qualite_travail: number;
  adaptable: number;
  commentaire?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = 'http://localhost:3000/api/evaluations'; // Base URL correspondant à app.js

  constructor(private http: HttpClient) { }


   // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  /**
   * Crée une nouvelle évaluation pour un stage terminé
   * @param data Données de l'évaluation
   */
  creerEvaluation(data: CreerEvaluationRequest): Observable<{
    message: string;
    evaluation: Evaluation;
  }> {
    return this.http.post<{
      message: string;
      evaluation: Evaluation;
    }>(`${this.apiUrl}/new`, data, { headers: this.getHeaders() });
  }

  /**
   * Supprime une évaluation (admin seulement)
   * @param evaluationId ID de l'évaluation à supprimer
   */
  supprimerEvaluation(evaluationId: number): Observable<{
    success: boolean;
    message: string;
    deleted_id: number;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
      deleted_id: number;
    }>(`${this.apiUrl}/${evaluationId}/delete`, { headers: this.getHeaders() });
  }


   getEvaluationByStageId(stageId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${stageId}`, { headers: this.getHeaders() });
  }
}