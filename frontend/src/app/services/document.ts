import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import{map} from 'rxjs';
export interface Document {
  id: number;
  type: string;
  lien: string;
  date_depot: string;
  statut: string;
  stage_id: number;
  absence_id?: number;
}
export interface JustificationResponse {
  isJustified: boolean;
  justification?: {
    id: number;
    lien: string;
    date_depot: string;
  };
}
export interface DocumentTreatment {
  id: number;
  action: string;
  date_traitement: string;
  commentaire: string;
  acteur: {
    id: number;
    nom: string;
    prenom: string;
    role: string;
  };
}


export interface ConventionResponse {
  id: number;
  type: string;
  statut: string;
  lien: string;
  date_depot: string;
}

export interface AttestationResponse {
  id: number;
  lien: string;
  date_depot: string;
} 
@Injectable({
  providedIn: 'root'
})
export class DocumentService {
private apiUrl = 'http://localhost:3000/api/documents';

  constructor(private http: HttpClient) {}
    // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }



  // Téléverser un document
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}`, formData, {  headers: this.getHeaders() });
 
  }

  
envoyerConvention(candidatureId: number, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'convention à signer');
  formData.append('candidature_id', candidatureId.toString());

  return this.uploadDocument(formData);
}

  // Traiter un justificatif d'absence
 processJustificatif(documentId: number, action: 'accepter' | 'refuser', commentaire?: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/justificatif/${documentId}/traiter`, 
    { 
      action,
      commentaire 
    },
    { 
      headers: this.getHeaders() 
    }
  );
}
  // Obtenir l'historique des traitements
  getDocumentHistory(documentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${documentId}/historique`,{ headers: this.getHeaders() });
  }
  // Obtenir le justificatif accepté pour une absence
 getAcceptedJustification(absenceId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/justificatif/valide/${absenceId}`,{ headers: this.getHeaders() });
  }
getJustificationForAbsence(absenceId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/justificatif/${absenceId}`, { headers: this.getHeaders() });

}

getTraitementHistoriqueForAbsence(absenceId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/absences/${absenceId}/historique-traitement`, { headers: this.getHeaders() });
}

  // Rapports
  getStageReports(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rapport/stage/${stageId}`,{ headers: this.getHeaders() });
  }

  getValidatedReport(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rapport/valide/${stageId}`,{ headers: this.getHeaders() });
  }

  hasValidatedReport(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rapport/has-valide/${stageId}`,{ headers: this.getHeaders() });
  }

  processReport(documentId: number, action: 'accepter' | 'refuser', commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/rapport/${documentId}/traiter`, {
      action,
      commentaire
    },
  { headers: this.getHeaders() });
  }


  getConventionsToSign(stageId: number): Observable<any> {
  return this.http.get<{ conventions?: any[] }>(`${this.apiUrl}/convention/a-signer/${stageId}`, { 
    headers: this.getHeaders() 
  }).pipe(
    map((response: { conventions?: any[] }) => response.conventions || []) // S'assurer que c'est toujours un tableau
  );
}

  getSignedConvention(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/convention/signee/${stageId}`,{ headers: this.getHeaders() });
  }

  hasSignedConvention(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/convention/has-signee/${stageId}`,{ headers: this.getHeaders() });
  }

  processConvention(documentId: number, action: 'valider' | 'refuser', commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convention/${documentId}/traiter`, {
      action,
      commentaire
    } , {headers: this.getHeaders() });
  }

  // conventions déjà traitées (acceptées ou refusées)
getProcessedConventions(stageId: number): Observable<any[]> {
  return this.http.get<{ conventions: any[] }>(
    `${this.apiUrl}/convention/traitees/${stageId}`, 
    { headers: this.getHeaders() }
  ).pipe(
    map((res) => res.conventions || [])
  );
}

getAllConventions(stageId: number): Observable<any[]> {
  return this.http.get<{ conventions: any[] }>(
    `${this.apiUrl}/convention/all/${stageId}`,
    { headers: this.getHeaders() }
  ).pipe(
    map(res => res.conventions || [])
  );
}
// 1. Conventions à signer par candidature
  getConventionsASignerByCandidature(candidatureId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/conventions-a-signer/candidature/${candidatureId}` ,  { headers: this.getHeaders() });
  }

  // 2. Conventions à signer non traitées par stage
  getConventionsASignerNonTraiteesByStage(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/conventions-a-signer/non-traitees/stage/${stageId}` , { headers: this.getHeaders() });
  }

  // 3. Conventions traitées par candidature
  getConventionsTraiteesByCandidature(candidatureId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/conventions-traitees/candidature/${candidatureId}` , { headers: this.getHeaders() });
  }


getConventionsSigneesByCandidat(candidatId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/conventions-signees/candidat/${candidatId}`, { 
    headers: this.getHeaders() 
  });
}











  getCandidaturesAttenteConvention(): Observable<any> {
  return this.http.get(`${this.apiUrl}/candidatures-attente-convention`, { 
    headers: this.getHeaders() 
  });
}

// Récupérer toutes les conventions d'un candidat
getConventionsCandidat(): Observable<any> {
  return this.http.get(`${this.apiUrl}/conventions-candidat`, { 
    headers: this.getHeaders() 
  });
}











  // Attestations
  hasStageAttestation(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attestation/has/${stageId}`,{ headers: this.getHeaders() });
  }

  getStageAttestation(stageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attestation/${stageId}`,{ headers: this.getHeaders() });
  }

  generateAttestation(stageId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/attestation/generer`, { stage_id: stageId },{ headers: this.getHeaders() });
  }














checkSignedConventionExists(candidatureId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/check-signed-convention/${candidatureId}`, { 
    headers: this.getHeaders() 
  });
}
  // Pour le RH
getConventionsASignerRH(): Observable<any> {
  return this.http.get(`${this.apiUrl}/conventions-rh/a-signer`, { 
    headers: this.getHeaders() 
  });
}

getConventionsSigneesRH(): Observable<any> {
  return this.http.get(`${this.apiUrl}/conventions-rh/signees`, { 
    headers: this.getHeaders() 
  });
}

// Pour envoyer une convention signée
envoyerConventionSignee(stageId: number, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'convention signée');
  formData.append('stage_id', stageId.toString());
  
  return this.uploadDocument(formData);
}



getUntreatedReports(encadrantId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/documents/rapports-non-traites/${encadrantId}`,{ headers: this.getHeaders() });
}
}
