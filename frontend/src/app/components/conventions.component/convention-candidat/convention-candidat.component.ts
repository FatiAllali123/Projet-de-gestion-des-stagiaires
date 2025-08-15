import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { StageService } from '../../../services/stage.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { AbsenceService } from '../../../services/absence.service';
import { DocumentService } from '../../../services/document';
import { AuthService } from '../../../services/auth.service';
import{Router , RouterModule} from '@angular/router';
@Component({
  selector: 'app-convention-candidat-component',
  templateUrl: './convention-candidat.component.html',
  styleUrl: './convention-candidat.component.css',
  imports: [CommonModule,RouterModule],
  providers: [DatePipe],
  standalone: true
})
export class ConventionCandidatComponent implements OnInit {
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




 showConventionsASigner = false;
 uploadingConvention = false;

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

     console.log('ConventionCandidatComponent initialized for stage:', this.stageId); // Debug
    this.loadStageDetails();
    this.loadConventions(); // Charger les conventions
  }



  loadStageDetails() {
  this.stageService.getStageDetails(this.stageId).subscribe({
    next: (response) => {
      this.stage = response;
   
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
 

 onConventionFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedConventionFile = file;
    }
  }

    // Upload de la convention
  uploadConvention() {
    if (!this.selectedConventionFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedConventionFile);
    formData.append('stage_id', this.stageId.toString());
    formData.append('type', 'convention à signer');

    this.documentService.uploadDocument(formData).subscribe({
      next: (response) => {
        console.log('Convention uploadée avec succès', response);
        this.loadConventions(); // Recharger la liste
        this.selectedConventionFile = null;
        // Réinitialiser le champ de fichier
        const fileInput = document.querySelector('#conventionFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        console.error('Erreur lors de l\'upload de la convention', err);
        this.conventionError = err.error?.message || 'Erreur lors de l\'envoi de la convention';
      }
    });
  }



 
onFileSelected(event: any, absenceId: number) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedAbsenceId = absenceId;
    }
  }



hasPendingJustification(absenceId: number): boolean {
  return this.justificationStatus[absenceId]?.justification?.statut === 'déposé';
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



toggleConventionsASigner() {
  this.showConventionsASigner = !this.showConventionsASigner;
}

// Fonction pour déclencher l'upload de fichier
triggerFileUpload(): void {
  const fileInput = document.getElementById('conventionFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

// Fonction pour annuler l'upload de convention
cancelConventionUpload(): void {
  this.selectedConventionFile = null;
  // Réinitialiser le champ de fichier
  const fileInput = document.getElementById('conventionFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// Fonction pour confirmer l'upload (identique à uploadConvention mais avec un nom cohérent)
confirmUpload(): void {
  this.uploadConvention();
}

// Fonction pour obtenir la convention signée
getSignedConvention(): any {
  return this.conventionSignee;
}

// Fonction pour obtenir les autres conventions (celles à signer)
getOtherConventions(): any[] {
  return this.conventionsASigner;
}

// Fonction pour basculer l'affichage des autres conventions
toggleOtherConventions(): void {
  this.showConventionsASigner = !this.showConventionsASigner;
}
 



}
