import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export interface Candidature {
  id?: number;
  statut_candidature: string;
  date_creation: string;
  cv: string;
  lettre_motivation: string;
  offre_id: number;
  candidat_id?: number;
  Offre?: Offre; // Offre associée, tu peux typer mieux
}

export interface Offre {
  id: number;
  titre: string;
  description: string;
  statut_offre: string;
  duree: string;
  mode_stage: string;
  type_stage: string;
  competences_requises: string;
  entretien_requis: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private apiUrl = 'http://localhost:3000/api/candidatures';

  constructor(private http: HttpClient) {}

  // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }


 postuler(offre_id: number, cvFile: File, lettreFile: File) {
    const formData = new FormData();
    formData.append('offre_id', offre_id.toString());
    formData.append('cv', cvFile);
    formData.append('lettre_motivation', lettreFile);

    return this.http.post(`${this.apiUrl}/postuler`, formData, { headers: this.getHeaders() });
  }

  checkAlreadyApplied(offreId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/offres/${offreId}/check`, {
    headers: this.getHeaders()
  });
}

  getMesCandidatures(statut?: string): Observable<Candidature[]> {
    let params = statut ? `?statut=${statut}` : '';
    return this.http.get<Candidature[]>(`${this.apiUrl}/mes-candidatures${params}` , { headers: this.getHeaders() });
  }

  annulerCandidature(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/annuler`, {},{ headers: this.getHeaders() });
  }

  getCandidaturesPourOffre(offre_id: number, statut_candidature?: string): Observable<any> {
    let params = statut_candidature ? `?statut_candidature=${statut_candidature}` : '';
    return this.http.get(`${this.apiUrl}/${offre_id}/candidatures${params}`,{ headers: this.getHeaders() });
  }

  accepterCandidature(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/accepter`, {} , { headers: this.getHeaders() });
  }

  refuserCandidature(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/refuser`, {} , { headers: this.getHeaders() });
  }

  preselectionnerCandidature(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/preselectionner`, {} , { headers: this.getHeaders() });
  }



 // Pour vérifier si un stage existe pour une candidature
getStageByCandidature(candidatureId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/stage-by-candidature/${candidatureId}`, {
    headers: this.getHeaders()
  });
}

}
