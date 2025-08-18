import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { StageService } from '../../../services/stage.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { AbsenceService } from '../../../services/absence.service';
import { DocumentService } from '../../../services/document';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import{Router , RouterModule} from '@angular/router';
@Component({
  selector: 'app-stage-details-stagiaire',
  templateUrl: './stage-details-stagiaire.component.html',
  styleUrls: ['./stage-details-stagiaire.component.css'],
  imports: [CommonModule,RouterModule],
  providers: [DatePipe]
})
export class StageDetailsStagiaireComponent implements OnInit {
  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();

  stage: any;
  loading = true;
   userRole: string | null = null;
  // evaluation
  evaluation: any = null;
  showEvaluationView = false;
  evaluationError: string | null = null;
  // absences
  absences: any[] = [];
  justificationStatus: { [key: number]: any } = {};
  selectedFile: File | null = null;
  selectedAbsenceId: number | null = null;
  
  // rapport
  rapports: any[] = [];
  selectedReportFile: File | null = null;
  loadingReports = false;
  reportError: string | null = null;

  // attestation
    attestation: any = null;
  attestationError: string | null = null;
  checkingAttestation = false;


  //conventions
   conventionSignee: any = null;
  conventionsASigner: any[] = [];
  loadingConventions = false;
  conventionError: string | null = null;
  selectedConventionFile: File | null = null;




  constructor(
    private stageService: StageService,
    private evaluationService: EvaluationService,
    private datePipe: DatePipe,
    private absenceService: AbsenceService,
    public documentService: DocumentService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
     this.auth.getCurrentUser().subscribe(user => {
      if (!user?.success) {
        this.router.navigate(['/login']);
        return;
      }

      this.userRole = user.role;});

    this.loadStageDetails();
    this.loadAttestation(); // Charger l'attestation
    this.loadConventions(); // Charger les conventions
  }

   loadAttestation() {
    this.checkingAttestation = true;
    this.documentService.getStageAttestation(this.stageId).subscribe({
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

  loadStageDetails() {
  this.stageService.getStageDetails(this.stageId).subscribe({
    next: (response) => {
      this.stage = response;
      this.loadEvaluation();
      this.loadAbsences();
      this.loadReports(); // Charger les rapports
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading stage details', err);
      this.loading = false;
    }
  });
}
  
loadConventions() {
  this.loadingConventions = true;
  this.conventionError = null;

  // Charger les conventions à signer d'abord (plus important pour l'UX)
  this.documentService.getConventionsToSign(this.stageId).subscribe({
    next: (conventions) => {
      this.conventionsASigner = conventions || [];
      
      // Ensuite charger la convention signée
      this.documentService.getSignedConvention(this.stageId).subscribe({
        next: (response) => {
          this.conventionSignee = response.convention || null;
          this.loadingConventions = false;
        },
        error: (err) => {
          if (err.status !== 404) {
            console.error('Erreur chargement convention signée', err);
            this.conventionError = "Erreur lors du chargement de la convention signée.";
          }
          this.loadingConventions = false;
        }
      });
    },
    error: (err) => {
      console.error('Erreur chargement conventions à signer', err);
      this.conventionError = "Erreur lors du chargement des conventions.";
      this.loadingConventions = false;
    }
  });
}
  // Evaluation
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



  // Modifier la fonction uploadJustification existante
uploadJustification(): void {
    if (this.isStageNotEncours()) {
    this.absenceError = "Le stage est terminé, vous ne pouvez plus déposer de justificatif.";
    return;
  }
  
  if (!this.selectedFile || !this.selectedAbsenceId) return;

  this.uploadingJustification = true;
  const formData = new FormData();
  formData.append('file', this.selectedFile);
  formData.append('stage_id', this.stageId.toString());
  formData.append('absence_id', this.selectedAbsenceId.toString());
  formData.append('type', "justificatif d'absence");

  this.documentService.uploadDocument(formData).subscribe({
    next: (response) => {
      console.log('Justificatif uploadé avec succès', response);
      this.checkJustificationStatus(this.selectedAbsenceId!);
      this.cancelJustificationUpload();
      this.uploadingJustification = false;
    },
    error: (err) => {
      console.error('Erreur lors de l\'upload du justificatif', err);
      this.absenceError = err.error?.message || 'Erreur lors de l\'envoi du justificatif';
      this.uploadingJustification = false;
    }
  });
}
hasPendingJustification(absenceId: number): boolean {
  return this.justificationStatus[absenceId]?.justification?.statut === 'déposé';
}



 // rapports 
 loadReports() {
  this.loadingReports = true;
  this.documentService.getStageReports(this.stageId).subscribe({
    next: (response) => {
      this.rapports = response.rapports || [];
      this.loadingReports = false;
    },
    error: (err) => {
      console.error('Erreur chargement rapports', err);
      this.reportError = err.error?.message || 'Erreur lors du chargement des rapports';
      this.loadingReports = false;
    }
  });
}
 onReportFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedReportFile = file;
  }
}


uploadReport() {
    if (this.isStageNotEncours()) {
    this.reportError = "Le stage est terminé, vous ne pouvez plus déposer de rapport.";
    return;
  }
  if (!this.selectedReportFile) return;

  this.uploadingReport = true;
  const formData = new FormData();
  formData.append('file', this.selectedReportFile);
  formData.append('stage_id', this.stageId.toString());
  formData.append('type', 'rapport');

  this.documentService.uploadDocument(formData).subscribe({
    next: (response) => {
      console.log('Rapport uploadé avec succès', response);
      this.loadReports();
      this.selectedReportFile = null;
      this.uploadingReport = false;
      // Réinitialiser le champ de fichier
      const fileInput = document.querySelector('#reportFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    error: (err) => {
      console.error('Erreur lors de l\'upload du rapport', err);
      this.reportError = err.error?.message || 'Erreur lors de l\'envoi du rapport';
      this.uploadingReport = false;
    }
  });
}

goBack() {
    this.back.emit();
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
formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
}




// Fonction pour vérifier s'il y a un rapport validé
rapportValide(): any {
  return this.rapports.find(rapport => rapport.statut.toLowerCase() === 'accepté');
}

// Fonction pour déclencher l'input file des rapports
triggerReportFileInput(): void {
  const fileInput = document.getElementById('reportFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

// Variable pour gérer l'affichage des rapports
showRapports = false;

// Fonction pour basculer l'affichage des rapports
toggleRapports(): void {
  this.showRapports = !this.showRapports;
}

// Fonction pour annuler l'upload d'un rapport
cancelReportUpload(): void {
  this.selectedReportFile = null;
  // Réinitialiser le champ de fichier
  const fileInput = document.getElementById('reportFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// Variable pour gérer l'état d'upload
uploadingReport = false;



absenceError: string | null = null;
uploadingJustification = false;

// Fonctions pour gérer l'upload des justificatifs
triggerJustificationFileInput(absenceId: number): void {
  const fileInput = document.getElementById('justificationFileInput_' + absenceId) as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

onJustificationFileSelected(event: any, absenceId: number): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    this.selectedAbsenceId = absenceId;
  }
}

cancelJustificationUpload(): void {
  this.selectedFile = null;
  this.selectedAbsenceId = null;
  // Réinitialiser tous les champs de fichier
  this.absences.forEach(absence => {
    const fileInput = document.getElementById('justificationFileInput_' + absence.id) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  });
}


isStageNotEncours(): boolean {
  return this.stage?.statut_stage?.toLowerCase() !== 'en cours';
}

}
