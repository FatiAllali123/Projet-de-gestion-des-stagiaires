import { Component, Input, OnInit } from '@angular/core';
import { StageService } from '../../../services/stage.service';
import { Output, EventEmitter } from '@angular/core';
import { AbsenceService } from '../../../services/absence.service';
import { DocumentService } from '../../../services/document';
import { EvaluationService } from '../../../services/evaluation.service';
import { FormBuilder, FormGroup, Validators , FormsModule} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-stage-details-encadrant',
  templateUrl: './stage-details-encadrant.component.html',
  styleUrls: ['./stage-details-encadrant.component.css'],
  providers: [DatePipe],
  imports : [CommonModule,FormsModule ,  ReactiveFormsModule,]

})
export class StageDetailsEncadrantComponent implements OnInit {
  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();
  
  stage: any;
  loading = true;
  absences: any[] = [];
  evaluation: any = null;
  showAbsenceForm = false;
  showEvaluationForm = false;
  absenceForm: FormGroup;
  evaluationForm: FormGroup;
  today = new Date().toISOString().split('T')[0];
   
  errorMessage: string | null = null; // Pour les erreurs générales
  absenceError: string | null = null; // Spécifique aux absences
  evaluationError: string | null = null; // Spécifique aux évaluations
  showEvaluationView = false; 

  //justificatif 
justificationStatus: { [key: number]: { isJustified: boolean, justification?: any } } = {};
selectedDocumentId: number | null = null;
processingJustification = false;
commentaire = '';

// Pour stocker l'historique des traitements
justificatifsHistorique: any[] = []; 
selectedAbsenceForHistorique: number | null = null;
loadingHistorique = false;

selectedDecision: { absenceId: number | null, action: string } = { absenceId: null, action: '' };

// rapports 
  // rapport
rapports: any[] = [];
selectedRapportCommentaire = '';
processingRapport = false;


  constructor(
    private stageService: StageService,
    private absenceService: AbsenceService,
    private evaluationService: EvaluationService,
    private documentService: DocumentService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
  ) {
    this.absenceForm = this.fb.group({
      date_absence: ['', Validators.required]
    });

    this.evaluationForm = this.fb.group({
      comportement: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      travail_equipe: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      qualite_travail: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      adaptable: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      commentaire: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    this.loadStageDetails();
  }

  loadStageDetails() {
    this.stageService.getStageDetails(this.stageId).subscribe({
      next: (response) => {
        this.stage = response;
        this.loadAbsences();
        this.loadRapports(); // Charger les rapports
        this.loadEvaluation();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stage details', err);
        this.loading = false;
      }
    });
  }


  //evaluation
  loadEvaluation() {
  if (this.stage?.statut_stage === 'Terminé') {
    this.evaluationService.getEvaluationByStageId(this.stageId).subscribe({
      next: (response) => {
        // Accédez à la propriété 'evaluation' de la réponse
        this.evaluation = response.evaluation;
        this.showEvaluationView = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.evaluation = null;
          this.showEvaluationForm = false;
        } else {
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
submitEvaluation() {
  if (this.evaluationForm.invalid) return;

  this.evaluationError = null;
  const evaluationData = {
    stage_id: this.stageId,
    ...this.evaluationForm.value
  };

  this.evaluationService.creerEvaluation(evaluationData).subscribe({
    next: (response) => {
      // Accédez à la propriété 'evaluation' de la réponse
      this.evaluation = response.evaluation;
      this.showEvaluationForm = false;
      this.showEvaluationView = true;
    },
    error: (err) => {
      console.error('Erreur lors de l\'enregistrement', err);
      this.evaluationError = err.error?.message || 'Erreur lors de l\'enregistrement de l\'évaluation';
      
      if (err.status === 400) {
        if (err.error.errors) {
          this.evaluationError = Object.values(err.error.errors).join(', ');
        }
      }
    }
  });
}
formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }



  //absences
loadAbsences() {
    this.absenceService.getAbsencesByStage(this.stageId).subscribe({
      next: (absences) => {
        console.log("Absences reçues :", absences);
        this.absences = absences;
        this.loadJustifications(); // Charger les justificatifs après les absences
        absences.forEach((absence: any) => {
          this.checkJustificationStatus(absence.id);
        });
      },
      error: (err) => {
        console.error('Error loading absences', err);
      }
    });
  }
// Méthode pour charger l'historique de traitement des justificatifs d'une absenc
loadTraitementHistorique(absenceId: number) {
  this.selectedAbsenceForHistorique = absenceId;
  this.loadingHistorique = true;
  
  this.documentService.getTraitementHistoriqueForAbsence(absenceId).subscribe({
    next: (response) => {
      this.justificatifsHistorique = response.justificatifs;
      this.loadingHistorique = false;
    },
    error: (err) => {
      console.error('Erreur chargement historique', err);
      this.loadingHistorique = false;
    }
  });
  }
// Méthode pour fermer l'historique
 closeHistorique() {
  this.selectedAbsenceForHistorique = null;
  this.justificatifsHistorique = [];
}
loadJustifications() {
  this.absences.forEach(absence => {
    if (!absence.is_justified) {
      this.documentService.getJustificationForAbsence(absence.id).subscribe({
        next: (response) => {
          if (response.justification && response.justification.statut === 'déposé') {
            this.justificationStatus[absence.id] = {
              isJustified: false,
              justification: response.justification
            };
          }
        },
        error: (err) => {
          console.error('Error loading justification', err);
        }
      });
    }
  });
}
processJustification(absenceId: number, action: 'accepter' | 'refuser') {
  const justification = this.justificationStatus[absenceId]?.justification;
  if (!justification) return;

  this.processingJustification = true;
  this.documentService.processJustificatif(justification.id, action, this.commentaire).subscribe({
    next: (response) => {
      this.processingJustification = false;
      // Mettre à jour le statut localement
      this.absences = this.absences.map(abs => {
        if (abs.id === absenceId) {
          return { ...abs, is_justified: action === 'accepter' };
        }
        return abs;
      });
      // Supprimer le justificatif traité
      delete this.justificationStatus[absenceId];
      this.commentaire = '';
    },
    error: (err) => {
      this.processingJustification = false;
      console.error('Error processing justification', err);
    }
  });
}
checkJustificationStatus(absenceId: number) {
  this.documentService.getAcceptedJustification(absenceId).subscribe({
    next: (response) => {
      this.justificationStatus[absenceId] = {
        isJustified: response.justification.isJustified, // Notez le changement ici
        justification: response.justification
      };
    },
    error: (err) => {
      console.error('Error checking justification status', err);
    }
  });
}
toggleAbsenceForm() {
    this.showAbsenceForm = !this.showAbsenceForm;
    if (this.showAbsenceForm) {
      this.absenceForm.reset();
    }
  }
submitAbsence() {
    if (this.absenceForm.invalid) return;

    const absenceData = {
      stage_id: this.stageId,
      date_absence: this.absenceForm.value.date_absence
    };

    this.absenceService.marquerAbsence(absenceData).subscribe({
      next: (response) => {
        console.log('Absence enregistrée', response);
        this.loadAbsences();
        this.showAbsenceForm = false;
      },
    error: (err) => {
        console.error('Erreur lors de l\'enregistrement', err);
        this.absenceError = err.error?.message || 'Erreur lors de l\'enregistrement de l\'absence';
        
        // Affichage spécifique pour les erreurs 400
        if (err.status === 400) {
          if (err.error.errors) {
            // Si le backend renvoie des erreurs de validation détaillées
            this.absenceError = Object.values(err.error.errors).join(', ');
          }
        }
      }
    });
  }
 

 // rapports 
loadRapports() {
  this.documentService.getStageReports(this.stageId).subscribe({
    next: (response) => {
     
          // Tri des rapports: acceptés en premier, puis par date
      this.rapports = response.rapports.sort((a:any, b:any) => {
        if (a.statut === 'accepté' && b.statut !== 'accepté') return -1;
        if (a.statut !== 'accepté' && b.statut === 'accepté') return 1;
        return new Date(b.date_depot).getTime() - new Date(a.date_depot).getTime();
      });
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur lors du chargement des rapports', err);
    }
  });
}

traiterRapport(documentId: number, action: 'accepter' | 'refuser') {
  this.processingRapport = true;
  this.documentService.processReport(documentId, action, this.selectedRapportCommentaire).subscribe({
    next: () => {
      this.processingRapport = false;
      this.selectedRapportCommentaire = '';
      this.loadRapports(); // Recharger la liste après traitement
    },
    error: (err) => {
      console.error('Erreur lors du traitement du rapport', err);
      this.processingRapport = false;
    }
  });
}
getStatutClass(statut: string): string {
  switch (statut.toLowerCase()) {
    case 'accepté':
      return 'accepte';
    case 'refusé':
      return 'refuse';
    default:
      return 'attente';
  }
}

  




 





getBadgeClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return 'En_cours';
      case 'terminé':
        return 'Terminé';
      case 'annulé':
        return 'Annulé';
      case 'planifié':
        return 'Planifié';
      default:
        return '';
    }
  }

 
goBack() {
    this.back.emit();
  }

  showComment: { [key: number]: boolean } = {};

toggleComment(id: number) {
  this.showComment[id] = !this.showComment[id];
}


showCommentaire: { [key: number]: boolean } = {};

toggleCommentaire(absenceId: number) {
  this.showCommentaire[absenceId] = !this.showCommentaire[absenceId];
}


getActionClass(action: string): string {
  switch(action.toLowerCase()) {
    case 'accepté':
    case 'accepter':
      return 'text-success'; // Classe CSS pour texte vert
    case 'refusé':
    case 'refuser':
      return 'text-danger';  // Classe CSS pour texte rouge
    case 'déposé':
      return 'text-info';    // Classe CSS pour texte bleu
    default:
      return '';             // Pas de classe spécifique
  }
}





startDecision(absenceId: number, action: string) {
  this.selectedDecision = { absenceId, action };
}

validateDecision(absenceId: number) {
  const action = this.selectedDecision.action;
  if (action === 'accepter' || action === 'refuser') {
    this.processJustification(absenceId, action);
  }
  this.selectedDecision = { absenceId: null, action: '' };
}
cancelDecision() {
  this.selectedDecision = { absenceId: null, action: '' };
  this.commentaire = '';
}
isFirstAccepted(rapport: any): boolean {
  // Vérifie si c'est le premier rapport accepté dans la liste
  return rapport.statut === 'accepté' && 
         this.rapports.findIndex(r => r.statut === 'accepté') === this.rapports.indexOf(rapport);
}
}

















































