import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { StageService } from '../../../services/stage.service';
import { AbsenceService } from '../../../services/absence.service';
import { DocumentService } from '../../../services/document';
import { EvaluationService } from '../../../services/evaluation.service';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-stage-details-encadrant',
  templateUrl: './stage-details-encadrant.component.html',
  styleUrls: ['./stage-details-encadrant.component.css'],
  providers: [DatePipe],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class StageDetailsEncadrantComponent implements OnInit {
  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();

  stage: any;
  loading = true;
  absences: any[] = [];
  evaluation: any = null;
  showAbsenceForm = false;
  absenceForm: FormGroup;
  today = new Date().toISOString().split('T')[0];

  absenceError: string | null = null;
  evaluationError: string | null = null;
  showEvaluationView = false;

  justificationStatus: { [key: number]: { isJustified: boolean, justification?: any } } = {};
  processingJustification = false;
  commentaire = '';

  selectedDecision: { absenceId: number | null, action: string } = { absenceId: null, action: '' };

  rapports: any[] = [];
  selectedRapportCommentaire = '';
  processingRapport = false;

  showComment: { [key: number]: boolean } = {};

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
  }

  ngOnInit() {
    this.loadStageDetails();
  }

  loadStageDetails() {
    this.stageService.getStageDetails(this.stageId).subscribe({
      next: (response) => {
        this.stage = response;
        this.loadAbsences();
        this.loadRapports();
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
          this.showEvaluationView = false;
        },
        error: (err) => {
          if (err.status === 404) {
            this.evaluation = null;
          } else {
            console.error('Error loading evaluation', err);
            this.evaluationError = err.error?.message || 'Erreur lors du chargement de l\'évaluation';
          }
        }
      });
    }
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  loadAbsences() {
    this.absenceService.getAbsencesByStage(this.stageId).subscribe({
      next: (absences) => {
        this.absences = absences;
        this.loadJustifications();
        absences.forEach((absence: any) => {
          this.checkJustificationStatus(absence.id);
        });
      },
      error: (err) => {
        console.error('Error loading absences', err);
      }
    });
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
      next: () => {
        this.processingJustification = false;
        this.absences = this.absences.map(abs =>
          abs.id === absenceId ? { ...abs, is_justified: action === 'accepter' } : abs
        );
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
          isJustified: response.justification.isJustified,
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
      next: () => {
        this.loadAbsences();
        this.showAbsenceForm = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement', err);
        this.absenceError = err.error?.message || 'Erreur lors de l\'enregistrement de l\'absence';
        if (err.status === 400 && err.error.errors) {
          this.absenceError = Object.values(err.error.errors).join(', ');
        }
      }
    });
  }

  loadRapports() {
    this.documentService.getStageReports(this.stageId).subscribe({
      next: (response) => {
        this.rapports = response.rapports.sort((a: any, b: any) => {
          if (a.statut === 'accepté' && b.statut !== 'accepté') return -1;
          if (a.statut !== 'accepté' && b.statut === 'accepté') return 1;
          return new Date(b.date_depot).getTime() - new Date(a.date_depot).getTime();
        });
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
        this.loadRapports();
      },
      error: (err) => {
        console.error('Erreur lors du traitement du rapport', err);
        this.processingRapport = false;
      }
    });
  }

  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'accepté': return 'accepte';
      case 'refusé': return 'refuse';
      default: return 'attente';
    }
  }

  getBadgeClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'en cours': return 'En_cours';
      case 'terminé': return 'Terminé';
      case 'annulé': return 'Annulé';
      case 'planifié': return 'Planifié';
      default: return '';
    }
  }

  goBack() {
    this.back.emit();
  }

  toggleComment(id: number) {
    this.showComment[id] = !this.showComment[id];
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
    return rapport.statut === 'accepté' &&
           this.rapports.findIndex(r => r.statut === 'accepté') === this.rapports.indexOf(rapport);
  }
}
