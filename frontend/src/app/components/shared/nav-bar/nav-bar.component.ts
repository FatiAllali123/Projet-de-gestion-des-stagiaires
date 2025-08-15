import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification-service';
import { Notification } from '../../../services/notification-service';
import { Router , RouterModule} from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  notificationsOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  isAuthenticated: boolean = false;

  private notifSub!: Subscription;

  constructor(
    public auth: AuthService,
    public notif: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.auth.getCurrentUser().subscribe({
    next: () => {
      this.isAuthenticated = true;
      console.log('statut auth ',this.isAuthenticated);
      
    },
    error: () => {
      this.isAuthenticated = false;
       console.log('statut auth ',this.isAuthenticated);
    }
  });

  this.notifSub = this.notif.unreadCount$.subscribe(count => {
    this.unreadCount = count;
  });

  this.loadNotifications();
}

  

  ngOnDestroy(): void {
    if (this.notifSub) this.notifSub.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.menuOpen = false;
      this.loadNotifications();
    }
  }

 loadNotifications(): void {
  console.log('Loading notifications...'); // Debug
  this.loading = true;
  this.notif.getUnreadNotifications().subscribe({
    next: (notifs) => {
      console.log('Notifications loaded:', notifs); // Debug
      this.notifications = notifs;
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading notifications:', err); // Debug
      this.loading = false;
    }
  });
}

  handleNotificationClick(notification: Notification): void {
    if (!notification.est_lu) {
      this.notif.markAsRead(notification.id).subscribe(() => {
        notification.est_lu = true;
        this.unreadCount--;
      });
    }
    if (notification.lien_action) {
      this.router.navigateByUrl(notification.lien_action);
    }
    this.notificationsOpen = false;
  }

  logout() {
    this.auth.logout();
     this.isAuthenticated = false; 
  }

  goToLogin(): void {
  this.router.navigate(['/login']);
}

goToSignup(): void {
  this.router.navigate(['/signup']);
}
goToDashboard(): void {
  this.router.navigate(['/dashboard']);
}
}