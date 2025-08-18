import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification-service';
import { Notification } from '../../../services/notification-service';
import { Router , RouterModule} from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../../services/NavigationService';
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
    private router: Router,
    public navigation: NavigationService,
    private eRef: ElementRef   
  ) {}

  ngOnInit(): void {
  this.auth.getCurrentUser().subscribe({
    next: () => {
      this.isAuthenticated = true;
      
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

  this.loading = true;
  this.notif.getUnreadNotifications().subscribe({
    next: (notifs) => {
     
      this.notifications = notifs;
      this.loading = false;
    },
    error: (err) => {
   
      this.loading = false;
    }
  });
}

  markAsRead(notification: Notification): void {
    console.log('Notification clicked:', notification);
    if (notification.est_lu) return;

    this.notif.markAsRead(notification.id).subscribe({
      next: () => {
  
        if (notification.lien_action === 'mes-candidatures') {
        this.navigation.navigate('mes-candidatures', { 
          candidatureId: notification.candidature_id ,
          entretienId   : notification.entretien_id,
          offreId : notification.offre_id
        });
        
     
      }
      if (notification.lien_action === 'mes-stages') {
        this.navigation.navigate('mes-stages', { 
          stageId: notification.stage_id ,
        
        });
      }
       
        if (notification.lien_action === 'mes-stages-encadrant') {
        this.navigation.navigate('mes-stages-encadrant', { 
          stageId: notification.stage_id ,
        
        });
      }
      


       if (notification.lien_action === 'cnv2') {
        this.navigation.navigate('cnv2');
      }
      
      if (notification.lien_action === 'rapports') {
        this.navigation.navigate('rapports');
      }

      this.notificationsOpen = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        
      }
    });
      
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