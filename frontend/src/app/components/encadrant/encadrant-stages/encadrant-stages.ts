
import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { StageService } from '../../../services/stage.service';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-encadrant-stages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encadrant-stages.html',
  styleUrl: './encadrant-stages.css'
})
export class EncadrantStages implements OnInit {
  stages: any[] = [];
  encadrant : any = null ; 
  loading = true;
  statutFilter = '';
  userRole: string = '';
  
  stagesEnCours: any[] = [];
stagesTermines: any[] = [];
stagesPlanifies: any[] = [];
  statutOptions = [
    { value: '', label: 'Tous' },
    { value: 'Planifié', label: 'Planifiés' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Terminé', label: 'Terminés' }
  ];

  @Input() encadrantId!: number;
  @Output() back = new EventEmitter<void>();
  @Output() stageSelected = new EventEmitter<number>();
  constructor(
    private router: Router,
    private utilisateurService: UtilisateurService,
    private stageService: StageService,
    private authService: AuthService, // Ajout
    private location: Location
  ) {}

  ngOnInit() {
 
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userRole = user.role;
            this.statutFilter = this.userRole === 'encadrant' ? 'En cours' : '';

        // S’il est admin ou rh, on a besoin d’un encadrantId
        if ((this.userRole === 'admin' || this.userRole === 'rh') && !this.encadrantId) {
          console.error('Aucun ID encadrant fourni pour un admin/rh');
          return;
        }

        this.loadData();


      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur connecté', err);
        this.loading = false;
      }
    });
  }

  loadData() {
    this.loading = true;
 const statut = this.statutFilter || undefined; // si vide → undefined
    if (this.userRole === 'admin' || this.userRole === 'rh') {
      this.stageService.getStagesEncadrant(this.encadrantId, this.statutFilter).subscribe({
        next: (stages) => {
          this.stages = stages;
          this.loading = false;
          this.updateFilteredStages();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else if (this.userRole === 'encadrant') {
      this.stageService.getMesStagesEncadrant(this.statutFilter).subscribe({
        next: (stages) => {
          this.stages = stages;
          this.loading = false;
          this.updateFilteredStages(); 
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      console.warn('Rôle non autorisé à voir les stages');
      this.loading = false;
    }
  }

  goBack() {
    this.back.emit();
  }

   showDetails(stageId: number) {
  console.log('emit');
   console.log('[EncadrantStages] selectStage()', stageId, 'role=', this.userRole);
  this.stageSelected.emit(stageId);
}


updateFilteredStages() {
  
  this.stagesEnCours = this.stages.filter(s => s.statut_stage === 'En cours');
  this.stagesTermines = this.stages.filter(s => s.statut_stage === 'Terminé');
  this.stagesPlanifies = this.stages.filter(s => s.statut_stage === 'Planifié');
}
}
