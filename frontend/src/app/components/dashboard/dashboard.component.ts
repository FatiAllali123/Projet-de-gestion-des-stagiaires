import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavBarComponent } from '../shared/nav-bar/nav-bar.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { ChangePassword } from '../change-password/change-password';
import {ProfilComponent } from '../profil/profil.component';
import { StaffManagementComponent } from '../staff-management/staff-management.component';
import {  GestionOffresComponent } from '../gestion-offres/gestion-offres';
import { ListeOffresComponent } from '../gestion-candidatures/liste-offres/liste-offres.component';
import { GestionCandidaturesComponent } from '../gestion-candidatures/gestion-candidatures.component';
import { EncadrantList } from '../encadrant/encadrant-list/encadrant-list';
import { EncadrantStages} from '../encadrant/encadrant-stages/encadrant-stages';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import{StagesListComponent} from '../stages/stages-list/stages-list';
import { MesCandidaturesComponent } from '../mes-candidatures/mes-candidatures';
import { StageDetailsRhComponent } from '../stages/stage-details-rh.component/stage-details-rh.component';
import { StageDetailsAdminComponent } from '../stages/stage-details-admin.component/stage-details-admin.component';
import { StageDetailsStagiaireComponent } from '../stages/stage-details-stagiaire.component/stage-details-stagiaire.component';
import{StageDetailsEncadrantComponent } from '../encadrant/stage-details-encadrant.component/stage-details-encadrant.component' ;
import{ ListStagesComponent } from '../conventions.component/list-stages/list-stages' ;
import {ConventionsComponent} from '../conventions.component/conventions.component';
import {ConventionsGestion} from '../../components/conventions-gestion/conventions-gestion';
import {Evaluation} from '../../components/evaluation/evaluation';
import { RapportGestion } from '../rapport-gestion/rapport-gestion';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NavBarComponent, ChangePassword, ProfilComponent, StaffManagementComponent,
    GestionOffresComponent, ListeOffresComponent, GestionCandidaturesComponent, EncadrantList, EncadrantStages, FormsModule,
    StagesListComponent, MesCandidaturesComponent, StageDetailsRhComponent, StageDetailsStagiaireComponent, StageDetailsAdminComponent,
    StageDetailsEncadrantComponent, ListStagesComponent, ConventionsComponent, ConventionsGestion, Evaluation,RapportGestion],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
userRole: string | null = null;
activeSection: string = '';

selectedOffreId: number | null = null;
selectedEncadrantId: number | null = null;
selectedStageId: number | null = null;

  constructor(private auth: AuthService, private router: Router, public route: ActivatedRoute) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (!user?.success) {
        this.router.navigate(['/login']);
        return;
      }

      this.userRole = user.role;
      this.setDefaultSection();
    });
  }

  setDefaultSection() {
    switch(this.userRole) {
      case 'admin':
        this.activeSection = 'stages-rh-admin';
        break;
      case 'rh':
        this.activeSection = 'stages-rh-admin';
        break;
      case 'encadrant':
        this.activeSection = 'mes-stages-encadrant';
        break;
      case 'candidat':
        this.activeSection = 'mes-stages';
        break;
      default:
        this.activeSection = 'mon-profil';
    }
  }

  onSectionSelected(section: string) {
    this.activeSection = section;
      this.selectedOffreId = null; // Réinitialiser l'affichage de candidatures si on change de section
  }

  
onOffreSelected(offreId: number) {
  this.selectedOffreId = offreId;
}
  
onRetourListe() {
  this.selectedOffreId = null;
}

onEncadrantBack() {
  this.selectedEncadrantId = null;
}
onStageSelected(stageId: number) {
  this.selectedStageId = stageId;
}

onBackToList() {
  this.selectedStageId = null;
}

onStageSelectedFromEncadrantList(stageId: number) {
  this.selectedStageId = stageId;
  
  // Si on vient de la liste des encadrants (comptes)
  if (this.activeSection === 'comptes') {
    // Admin voit la vue admin, encadrant voit la vue encadrant
    this.activeSection = this.userRole === 'admin'||'rh' ? 'stages-rh-admin' : 'mes-stages-encadrant';
  }
}

  logout() {
    this.auth.logout();
 
  }


}