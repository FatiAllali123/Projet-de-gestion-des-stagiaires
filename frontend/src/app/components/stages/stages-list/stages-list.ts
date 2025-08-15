
import { Component, OnInit } from '@angular/core';
import { StageService } from '../../../services/stage.service';
import {  CommonModule , NgClass, DatePipe} from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms'; 
import { Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-stages-list',
  templateUrl: './stages-list.html',
  styleUrls: ['./stages-list.css'],
  imports: [CommonModule,DatePipe , FormsModule]
})
export class StagesListComponent implements OnInit {
  stages: any[] = []; // Utilisez any[] au lieu de Stage[]
  loading = true;
  errorMessage: string | null = null;
 isHistoriqueMode = false;
  userRole: string = '';
  statutFilter: string = '';
@Output() stageSelected = new EventEmitter<number>();
    statutOptions = [
    { value: '', label: 'Tous' },
    { value: 'Planifié', label: 'Planifiés' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Terminé', label: 'Terminés' }
  ];
  constructor(private stageService: StageService , private authService: AuthService,) {}

   ngOnInit() {
 
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userRole = user.role;
       this.statutFilter = this.userRole === 'candidat' ? 'En cours' : '';

       
        if ((this.userRole === 'admin' || this.userRole === 'rh') ) {
       this.loadActiveStages(); // pour stagiaire
        }

        else if (this.userRole === 'candidat'){
     this.loadMesStages(); // pour RH/Admin
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur connecté', err);
        this.loading = false;
      }
    });
  }
  loadActiveStages(): void {
      this.isHistoriqueMode = false;
    this.loading = true;
    this.errorMessage = null;
    
    this.stageService.getStagesActifs().subscribe({
      next: (response: any) => { // Spécifie any[] comme type de retour
       
         this.stages = Array.isArray(response) ? response : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stages:', err);
        this.errorMessage = 'Erreur lors du chargement des stages';
        this.loading = false;
      }
    });
  }

  loadMesStages(): void {
  this.loading = true;
  this.isHistoriqueMode = false;
  this.errorMessage = null;

  this.stageService.getMesStagesStagiaire(this.statutFilter).subscribe({
    next: (response: any) => {
   
      this.stages = Array.isArray(response) ? response : [];
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur chargement stages stagiaire:', err);
      this.errorMessage = 'Erreur chargement stages';
      this.loading = false;
    }
  });
}
  loadHistoriqueStages(): void {
    this.isHistoriqueMode = true;
    this.loading = true;
    this.errorMessage = null;

    this.stageService.getHistoriqueStages().subscribe({
      next: (stages: any[]) => {
        this.stages = stages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stages terminés:', err);
        this.errorMessage = 'Erreur lors du chargement des stages terminés';
        this.loading = false;
      }
    });
  }


  showDetails(stageId: number) {
  this.stageSelected.emit(stageId);
}
getBadgeClass(statut: string): string {
  switch (statut.toLowerCase()) {
    case 'en cours':
    case 'en cours d\'execution':
      return 'badge En_cours';
    case 'terminé':
    case 'terminés':
      return 'badge Terminé';
    case 'annulé':
    case 'planifié':
      return 'badge Planifié';
    default:
      return 'badge';
  }
}
}