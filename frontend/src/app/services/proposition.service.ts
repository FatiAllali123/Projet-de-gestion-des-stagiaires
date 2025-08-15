import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

interface Proposition {
  id: number;
  candidature_id: number;
  date_debut_proposee: string;
  date_fin_proposee: string;
  statut: string;
  commentaire: string | null;
  date_proposition: string;
  date_traitement: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropositionService {

  private apiUrl = 'http://localhost:3000/api/propositions'; // adapte le port/url

  constructor(private http: HttpClient) { }
  // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }


  proposerPeriode(data: {
    candidature_id: number;
    date_debut_proposee: string;
    date_fin_proposee: string;
    commentaire?: string;
  }): Observable<{ message: string; proposition: Proposition }> {
    return this.http.post<{ message: string; proposition: Proposition }>(
      `${this.apiUrl}/proposer`, data,{ headers: this.getHeaders() });
  }

  traiterPeriode(propositionId: number, action: 'accepter' | 'refuser', commentaire?: string): Observable<{ message: string; proposition: Proposition }> {
    return this.http.put<{ message: string; proposition: Proposition }>(
      `${this.apiUrl}/traiter/${propositionId}`,
      { action, commentaire },
      { headers: this.getHeaders() }
    );
  }


  getPropositionsByCandidature(candidatureId: number): Observable<Proposition[]> {
    return this.http.get<Proposition[]>(`${this.apiUrl}/propositions/candidature/${candidatureId}`,{ headers: this.getHeaders() });
  }


  getPropositionsNonTraitees(candidatureId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/propositions/non-traitees/${candidatureId}` , { headers: this.getHeaders() });
  }
 
  getPropositionsTraitees(candidatureId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/propositions/traitees/${candidatureId}` , { headers: this.getHeaders() });
  }
 
}