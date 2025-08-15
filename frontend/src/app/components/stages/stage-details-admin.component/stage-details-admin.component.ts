

import { Component, Input, OnInit } from '@angular/core';
import { StageService } from '../../../services/stage.service';
import { Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../../services/evaluation.service';
import { DatePipe } from '@angular/common';
import{Router , RouterModule} from '@angular/router';
import { DocumentService } from '../../../services/document';

@Component({
  selector: 'app-stage-details-admin',
  templateUrl: './stage-details-admin.component.html',
  styleUrls: [ './stage-details-admin.component.css'],
  imports: [CommonModule,RouterModule],
  providers: [DatePipe]
})
export class  StageDetailsAdminComponent  implements OnInit {
  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();
  
  stage: any;
  loading = true;
  evaluation: any = null;
  showEvaluationView = false;
  evaluationError: string | null = null;


   //rapport 
  rapportValide: any = null;
  rapportError: string | null = null;

  // attestation
    attestation: any = null;
  attestationError: string | null = null;
  checkingAttestation = false;


  // conventions

 conventions: any[] = [];
  

  constructor(
    private stageService: StageService,
    private evaluationService: EvaluationService,
    private datePipe: DatePipe,
    private documentservice: DocumentService,
  ) {}

  ngOnInit() {
    this.loadStageDetails();
    this.loadRapportValide();
     this.loadAttestation(); // Charger l'attestation
     this.loadConventions();
   
  }

   loadAttestation() {
    this.checkingAttestation = true;
    this.documentservice.getStageAttestation(this.stageId).subscribe({
      next: (response) => {
        this.attestation = response.attestation;
        this.checkingAttestation = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.attestation = null; // Aucune attestation trouvée
        } else {
          console.error('Erreur chargement attestation', err);
          this.attestationError = "Erreur lors du chargement de l'attestation.";
        }
        this.checkingAttestation = false;
      }
    });
  }

   loadRapportValide() {
  this.documentservice.getValidatedReport(this.stageId).subscribe({
    next: (response) => {
      this.rapportValide = response.rapport;
      console.log(this.rapportValide.lien);
    },
    error: (err) => {
      if (err.status === 404) {
        this.rapportValide = null; // Aucun rapport validé
      } else {
        console.error('Erreur chargement rapport validé', err);
        this.rapportError = "Erreur lors du chargement du rapport validé.";
      }
    }
  });
}
  loadStageDetails() {
    this.stageService.getStageDetails(this.stageId).subscribe({
      next: (response) => {
        this.stage = response;
        this.loadEvaluation();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stage details', err);
        this.loading = false;
      }
    });
  }

  loadEvaluation() {
    if (this.stage?.statut_stage === 'Terminé') {
      this.evaluationService.getEvaluationByStageId(this.stageId).subscribe({
        next: (response) => {
          this.evaluation = response.evaluation;
        },
        error: (err) => {
          if (err.status !== 404) {
            console.error('Error loading evaluation', err);
            this.evaluationError = err.error?.message || 'Erreur lors du chargement de l\'évaluation';
          }
        }
      });
    }
  }

  closeEvaluationView() {
    this.showEvaluationView = false;
  }

  goBack() {
    this.back.emit();
  }

 getBadgeClass(statut: string): string {
  switch (statut.toLowerCase()) {
    case 'en cours':
    case 'en cours d\'execution':
      return 'En_cours';
    case 'terminé':
    case 'terminés':
      return 'Terminé';
    case 'annulé':
    case 'planifié':
      return 'planifié';
    default:
      return '';
  }
}

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }




loadConventions() {
  this.documentservice.getAllConventions(this.stageId).subscribe({
    next: (data) => this.conventions = data,
    error: (err) => console.error('Erreur chargement conventions', err)
  });
}
// Méthode pour obtenir la convention signée
getSignedConvention(): any {
  return this.conventions.find(conv => conv.type === 'convention signée');
}



}
