import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators'; // Import tap for side effects

export interface Notification {
  id: number;
  utilisateur_id: number;
  titre: string;
  message: string;
  type: string;
  lien_action?: string;
  est_lu: boolean;
  date_creation: Date;
  date_lecture?: Date;
  candidature_id?: number; // ID de la candidature associée, si applicable
  offre_id ?:number; // ID de l'offre associée
  entretien_id?: number; // ID de l'entretien associé
  stage_id?: number; // ID du stage associé
  document_id?: number; // ID du document associé, 

}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl ='http://localhost:3000/api/notifications'; // Base URL définie dans app.js

private unreadCountSubject = new BehaviorSubject<number>(0);
public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Méthode privée pour générer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }


  // Marque une notification comme lue
  markAsRead(notificationId: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${notificationId}/lue`,
      {} // Corps vide, car la logique est côté backend
    , { headers: this.getHeaders() }).pipe(
      tap(() => {
        // 👇 Décrémenter le compteur quand une notif est marquée comme lue
        const current = this.unreadCountSubject.value;
        if (current > 0) {
          this.unreadCountSubject.next(current - 1);
        }
      })
    );
  }
// Mettre à jour après chaque chargement
getUnreadNotifications(): Observable<Notification[]> {

  return this.http.get<Notification[]>(
    `${this.apiUrl}/non-lues`,
    { headers: this.getHeaders() }
  ).pipe(
    tap(notifs => {
     
      this.unreadCountSubject.next(notifs.length);
    })
  );
}
 
}