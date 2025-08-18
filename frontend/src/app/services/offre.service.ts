import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
export interface Offre {
  id?: number;
  titre: string;
  description: string;
  competences_requises: string;
  duree: string;
  mode_stage: string;
  type_stage: string;
  entretien_requis: boolean;
  dateDebutApprox?: string;
  statut_offre: string;
  rh_id?: number;
  created_at?: string;
  // autres champs selon besoin
}

@Injectable({
  providedIn: 'root'
})
export class OffreService {
  private apiUrl = 'http://localhost:3000/api/offres';

  constructor(private http: HttpClient) {}

// Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Créer une nouvelle offre (POST /newOffre)
  createOffre(offre: Offre): Observable<{ message: string; offre: Offre }> {
    return this.http.post<{ message: string; offre: Offre }>(`${this.apiUrl}/newOffre`, offre , { headers: this.getHeaders() });
  }

  // Mettre à jour une offre (PUT /:id/update)
  updateOffre(id: number, data: Partial<Offre>): Observable<{ message: string; modifications: number }> {
    return this.http.put<{ message: string; modifications: number }>(`${this.apiUrl}/${id}/update`, data , { headers: this.getHeaders() });
  }

  // Activer ou désactiver une offre (PUT /:id/status)
  toggleOffreStatus(id: number, action: 'activate' | 'deactivate'): Observable<{ message: string; nouveauStatut: string }> {
    return this.http.put<{ message: string; nouveauStatut: string }>(`${this.apiUrl}/${id}/status`, { action } , { headers: this.getHeaders() });
  }

  // Récupérer toutes les offres (GET /)
  /*
  getAllOffres(): Observable<Offre[]> {
    return this.http.get<Offre[]>(this.apiUrl ,  { headers: this.getHeaders() }) 
  }*/
getAllOffres(filters?: {
  statut?: string;
  type?: string;
  mode?: string;

}): Observable<Offre[]> {
  let params = new HttpParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.append(key, value.toString());
      }
    });
  }

  return this.http.get<Offre[]>(`${this.apiUrl}`, { params ,headers: this.getHeaders()});
}
  // Récupérer toutes les offres (GET /)
  getAllActiveOffres(): Observable<Offre[]> {
    return this.http.get<Offre[]>( `${this.apiUrl}/AllOffres`,  { headers: this.getHeaders() }) 
  }

  // Filtrer les offres selon les critères (GET /filtred)
  filtrerOffres(filtres: {
    titre?: string;
    competences?: string;
    description?: string;
    duree?: string;
    mode_stage?: string;
    type_stage?: string;
    entretien_requis?: boolean;
  }): Observable<Offre[]> {
    const params = new URLSearchParams();
    (Object.keys(filtres) as (keyof typeof filtres)[]).forEach(key => {
      if (filtres[key] !== undefined && filtres[key] !== null) {
        params.append(key, filtres[key]!.toString());
      }
    });
    return this.http.get<Offre[]>(`${this.apiUrl}/filtred?${params.toString()}` , { headers: this.getHeaders() });
  }

  // Supprimer une offre (DELETE /:id/delete)
  deleteOffre(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/delete` , { headers: this.getHeaders() });
  }

      getOffreById(offreId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${offreId}`, { headers: this.getHeaders() });
  }
}
