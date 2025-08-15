import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification-service';
import { Notification } from '../../services/notification-service';
import { AuthService } from '../../services/auth.service';
import { RouterModule ,  Router} from '@angular/router';
import { CommonModule } from '@angular/common';
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
    private authService: AuthService
  ) {}

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
        notification.est_lu = true;
        notification.date_lecture = new Date();
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