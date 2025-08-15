import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  userRole: string | null = null;
  @Output() sectionSelected = new EventEmitter<string>();

  menuItems: { label: string; section: string }[] = [];
@Output() logoutRequested = new EventEmitter<void>(); // Nouvel EventEmitter
  constructor(private auth: AuthService , private router : Router) {}

 ngOnInit() {
  this.auth.getCurrentUser().subscribe(user => {
    this.userRole = user?.success ? user.role : null;
    console.log('User role:', this.userRole);
  });
}

  select(section: string) {

  if (section === 'log-out') {
    this.logoutRequested.emit(); // Émet l'événement de déconnexion
  } else {
    this.sectionSelected.emit(section);
  }
}
  redirectToHome(): void {
  this.router.navigate(['/Home']);
}
}
