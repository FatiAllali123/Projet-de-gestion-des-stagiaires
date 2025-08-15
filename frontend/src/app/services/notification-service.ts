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
  // Autres champs optionnels (offre_id, candidature_id, etc.)
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


  // Récupère les notifications non lues
  /*getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/non-lues`);
  }
*/
  // Marque une notification comme lue
  markAsRead(notificationId: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${notificationId}/lue`,
      {} // Corps vide, car la logique est côté backend
    , { headers: this.getHeaders() });
  }
// Mettre à jour après chaque chargement
getUnreadNotifications(): Observable<Notification[]> {
  console.log('Fetching unread notifications...'); // Debug
  return this.http.get<Notification[]>(
    `${this.apiUrl}/non-lues`,
    { headers: this.getHeaders() }
  ).pipe(
    tap(notifs => {
      console.log('Notifications received:', notifs); // Debug
      this.unreadCountSubject.next(notifs.length);
    })
  );
}
 
}