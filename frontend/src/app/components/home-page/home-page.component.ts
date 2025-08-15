import { Component, OnInit } from '@angular/core';
import { OffreService ,Offre } from '../../services/offre.service'; // adapte le chemin
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms' ;
import { NavBarComponent } from '../shared/nav-bar/nav-bar.component';
import { AuthService } from '../../services/auth.service';
import { CandidatureService } from '../../services/candidature.service';
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  imports: [CommonModule,FormsModule, NavBarComponent]
})
export class HomePageComponent implements OnInit {
  offres: Offre[] = [];
  loading = false;
  errorMessage: string | null = null;

  // Filtres
  filtreTitre: string = '';
  filtreCompetences: string = '';
  filtreTypeStage: string = '';
  filtreModeStage: string = '';
  filtreEntretienRequis: boolean | null = null;

   // Postulation
  selectedOffre: Offre | null = null;
  showModal: boolean = false;
  postulationError: string | null = null;
  successMessage: string | null = null;
  cv: File | null = null;
   lettreMotivation: File | null = null;
  userRole: string = '';

  constructor(private offreService: OffreService,  private authService: AuthService,
    private candidatureService: CandidatureService) {}

  ngOnInit() {
      this.loadOffres();
     this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userRole = user.role;
        console.log('user.role' , this.userRole);
       

      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur connecté', err);
        this.loading = false;
      }
    });
  
    
  }

  loadOffres(): void {
    this.loading = true;
    this.errorMessage = null;
    this.offreService.getAllActiveOffres().subscribe({
      next: (data) => {
        this.offres = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement des offres";
        this.loading = false;
      }
    });
  }
   


  appliquerFiltres(): void {
    const filtres: any = {};
    if (this.filtreTitre) filtres.titre = this.filtreTitre;
    if (this.filtreCompetences) filtres.competences = this.filtreCompetences;
    if (this.filtreTypeStage) filtres.type_stage = this.filtreTypeStage;
    if (this.filtreModeStage) filtres.mode_stage = this.filtreModeStage;
    if (this.filtreEntretienRequis !== null) filtres.entretien_requis = this.filtreEntretienRequis;

    this.loading = true;
    this.errorMessage = null;
    this.offreService.filtrerOffres(filtres).subscribe({
      next: (data) => {
        this.offres = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Erreur lors du filtrage des offres";
        this.loading = false;
      }
    });
  }

  postuler(offre: Offre): void {
    this.postulationError = null;
    this.successMessage = null;

    if (!this.userRole || this.userRole!== 'candidat') {
      this.postulationError = "Vous devez être connecté en tant que candidat pour postuler à cette offre.";
      return;
    }

   
  this.selectedOffre = offre;
  this.cv = null;
  this.lettreMotivation = null;
  this.showModal = true;
  }

 envoyerCandidature(): void {
  this.postulationError = null;

  if (!this.cv || !this.lettreMotivation) {
    this.postulationError = "Veuillez sélectionner un CV et une lettre de motivation.";
    return;
  }

  if (!this.selectedOffre || this.selectedOffre.id === undefined) {
    this.postulationError = "Offre invalide, impossible de postuler.";
    return;
  }

  this.candidatureService.postuler(
    this.selectedOffre.id!,
    this.cv,
    this.lettreMotivation
  ).subscribe({
    next: () => {
      this.successMessage = "Votre candidature a été envoyée avec succès.";
      this.showModal = false;
      this.cv = null;
      this.lettreMotivation = null;
    },
    error: (err) => {
      this.postulationError = err.error?.message || "Erreur lors de l'envoi de la candidature.";
    }
  });
}


  onCvFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.cv = input.files[0];
  }
}

onLettreFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.lettreMotivation = input.files[0];
  }
}

fermerModal(): void {
  this.showModal = false;
  this.selectedOffre = null;
  this.postulationError = null;
  this.cv = null;
  this.lettreMotivation = null;
}
  closeError() {
  this.postulationError = null;
}

closeSuccess() {
  this.successMessage = null;
}
}
