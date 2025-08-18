
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification-service';
import { Notification } from '../../services/notification-service';
import { AuthService } from '../../services/auth.service';
import { RouterModule ,  Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/NavigationService';
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
  imports: [RouterModule , CommonModule]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    public navigation: NavigationService
  ) {

    // Ceci va loguer toutes les tentatives de navigation
  this.router.events.subscribe(event => {
    if (event instanceof NavigationStart) {
      console.log('Tentative de navigation vers:', event.url);
      if (event.url.includes('mes-candidatures')) {
        console.trace('Stack trace de la navigation non désirée');
      }
    }
  });


  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = null;

    this.notificationService.getUnreadNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.isLoading = false;

        
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.est_lu) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        console.log('Notification marquée comme lue:', notification.id);
        notification.est_lu = true;
        notification.date_lecture = new Date();
        console.log('Avant navigation vers section');
   
       if (notification.lien_action === 'mes-candidatures') {
        this.navigation.navigate('mes-candidatures', { 
          candidatureId: notification.candidature_id 
        });
         console.log('Après navigation vers section');

      }
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
      
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}