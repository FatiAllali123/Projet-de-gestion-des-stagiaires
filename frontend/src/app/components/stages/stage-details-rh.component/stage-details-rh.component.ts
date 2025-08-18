import { Component, Input, OnInit } from '@angular/core';
import { StageService } from '../../../services/stage.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import{Router , RouterModule} from '@angular/router';
import { EvaluationService } from '../../../services/evaluation.service'; // Ajout
import { DatePipe } from '@angular/common'; // Ajout
import { DocumentService } from '../../../services/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stage-details-rh',
  templateUrl: './stage-details-rh.component.html',
  styleUrls: ['./stage-details-rh.component.css'],
  imports : [ CommonModule,RouterModule],
  providers: [DatePipe] // Ajout
})
export class StageDetailsRhComponent implements OnInit {
  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();


  
  stage: any;
  loading = true;
  encadrants: any[] = [];
  searchForm: FormGroup;

  showEncadrantList = false;
  isAffecting = false;
  selectedEncadrantId: number | null = null;

  evaluation: any = null; // Ajout
  showEvaluationView = false; // Ajout
  evaluationError: string | null = null; 

  //rapport 
  rapportValide: any = null;
  rapportError: string | null = null;


  // Nouveaux états pour l'attestation
  attestationExiste: boolean = false;
  attestation: any = null;
  stageTermine: boolean = false;
  generatingAttestation: boolean = false;
  attestationError: string | null = null;

  // conventions
  conventions: any[] = [];
  uploadingConvention = false;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  showConfirmation = false;
  rapportValideExiste: boolean = false;
  constructor(
    private stageService: StageService,
    private userService: UtilisateurService,
    private evaluationService: EvaluationService, 
    private fb: FormBuilder,
    private datePipe: DatePipe ,
    private documentservice: DocumentService,
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit() {
   
    this.loadStageDetails();
    this.loadRapportValide();
    this.loadConventions(); 
     this.checkAttestation(); // Vérifier l'attestation
  }


  
  loadStageDetails() {
    this.stageService.getStageDetails(this.stageId).subscribe({
      next: (response) => {
        this.stage = response;
     
          this.loadEvaluation(); 
          this.checkStageStatus(); // Vérifier l'état du stage
          this.checkAttestation(); // Vérifier l'attestation
        
        this.loading = false;
        
        // Pré-sélectionner l'encadrant actuel s'il existe
        if (this.stage.Encadrant) {
          this.selectedEncadrantId = this.stage.Encadrant.id;
        }
      },
      error: (err) => {
        console.error('Error loading stage details', err);
        this.loading = false;
      }
    });
  }
   // Vérifier si le stage est terminé
  checkStageStatus() {
    if (this.stage?.date_fin) {
      const aujourdHui = new Date();
      const dateFin = new Date(this.stage.date_fin);
      this.stageTermine = dateFin <= aujourdHui;
    }
  }
    // Vérifier l'existence de l'attestation
  checkAttestation() {
  
      this.documentservice.hasStageAttestation(this.stageId).subscribe({
        next: (response: any) => {
          this.attestationExiste = response.hasAttestation;
          if (this.attestationExiste) {
            console.log('Attestation existe pour le stage', this.stageId);

            this.documentservice.getStageAttestation(this.stageId).subscribe({
              next: (attestation: any) => {
                this.attestation = attestation.attestation;
              },
              error: (err) => console.error(err)
            });
          }
        },
        error: (err) => console.error(err)
      });
    }
  

  // Générer l'attestation
  genererAttestation() {
    this.attestationError = null;
    this.generatingAttestation = true;
    
    this.documentservice.generateAttestation(this.stageId).pipe(
      finalize(() => this.generatingAttestation = false)
    ).subscribe({
      next: () => {
        this.checkAttestation(); // Recharger les infos attestation
      },
      error: (err) => {
        console.error('Erreur génération attestation', err);
        this.attestationError = "Erreur lors de la génération. Veuillez réessayer.";
      }
    });
  }

 // 
  loadEvaluation() {
    console.log("statut_stage:",this.stage?.statut_stage);
    if (this.stage?.statut_stage === 'Terminé') {
      this.evaluationService.getEvaluationByStageId(this.stageId).subscribe({
        next: (response) => {
          this.evaluation = response.evaluation;
        },
        error: (err) => {
          if (err.status !== 404) { // On ignore l'erreur 404 (évaluation non trouvée)
            console.error('Error loading evaluation', err);
            this.evaluationError = err.error?.message || 'Erreur lors du chargement de l\'évaluation';
          }
        }
      });
    }
  }
   //  méthode pour fermer la vue d'évaluation
  closeEvaluationView() {
    this.showEvaluationView = false;
  }

  toggleEncadrantList() {
    this.showEncadrantList = !this.showEncadrantList;
    if (this.showEncadrantList) {
      this.searchEncadrants();
    }
  }

  searchEncadrants() {
    const searchTerm = this.searchForm.get('search')?.value;
    this.userService.getEncadrants(searchTerm).subscribe({
      next: (encadrants) => {
        this.encadrants = encadrants;
      },
      error: (err) => {
        console.error('Error loading encadrants', err);
      }
    });
  }

  selectEncadrant(encadrantId: number) {
    this.selectedEncadrantId = encadrantId;
  }

  affecterOuModifierEncadrant() {
    if (this.isStageNotEncours()) {
    Swal.fire({
      icon: 'warning',
      title: 'Action impossible',
      text: 'Le stage est terminé, vous ne pouvez plus affecter ou modifier l’encadrant.',
      confirmButtonText: 'OK'
    });
    return;
  }
  
    if (!this.selectedEncadrantId) return;

    this.isAffecting = true;
    
    // Si le stage a déjà un encadrant, on appelle changerEncadrant
    if (this.stage.encadrant_id) {
      this.stageService.changerEncadrant(this.stageId, this.selectedEncadrantId)
        .pipe(finalize(() => this.isAffecting = false))
        .subscribe({
          next: (response) => {
            console.log('Encadrant changé avec succès', response);
            this.loadStageDetails();
            this.showEncadrantList = false;
          },
          error: (err) => {
            console.error('Erreur lors du changement', err);
          }
        });
    } 
    // Sinon, on appelle affecterEncadrant
    else {
      this.stageService.affecterEncadrant(this.stageId, this.selectedEncadrantId)
        .pipe(finalize(() => this.isAffecting = false))
        .subscribe({
          next: (response) => {
            console.log('Encadrant affecté avec succès', response);
            this.loadStageDetails();
            this.showEncadrantList = false;
          },
          error: (err) => {
            console.error('Erreur lors de l\'affectation', err);
          }
        });
    }
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

  // méthode pour formater les dates
  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }




  // rapport
  loadRapportValide() {
  this.documentservice.getValidatedReport(this.stageId).subscribe({
    next: (response) => {
      this.rapportValide = response.rapport;
       this.rapportValideExiste = !!response.rapport; // true si rapport existe
    },
    error: (err) => {
      if (err.status === 404) {
        this.rapportValide = null; // Aucun rapport validé
         this.rapportValideExiste = false;
      } else {
        console.error('Erreur chargement rapport validé', err);
        this.rapportError = "Erreur lors du chargement du rapport validé.";
        this.rapportValideExiste = false;
      }
    }
  });
}


  // Conventions

loadConventions() {
  this.documentservice.getAllConventions(this.stageId).subscribe({
    next: (data) => this.conventions = data,
    error: (err) => console.error('Erreur chargement conventions', err)
  });
}




 
onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    
    // Créer une URL de prévisualisation pour les images/PDF
    if (file.type.match('image.*') || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreviewUrl = null;
    }
    
    this.showConfirmation = true;
  }
}



confirmUpload() {
  if (this.selectedFile) {
    this.uploadingConvention = true;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('stage_id', this.stageId.toString());
    formData.append('type', 'convention signée'); // <- IMPORTANT

    this.documentservice.uploadDocument(formData).subscribe({
      next: () => {
        this.loadConventions();
        this.resetUploadForm();
      },
      error: (err) => {
        console.error('Erreur upload convention signée', err);
        this.uploadingConvention = false;
      }
    });
  }
}

cancelUpload() {
  this.selectedFile = null;
  this.filePreviewUrl = null;
  this.showConfirmation = false;
}
  

resetUploadForm() {
  this.selectedFile = null;
  this.filePreviewUrl = null;
  this.showConfirmation = false;
  const fileInput = document.getElementById('conventionUpload') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}


// Méthode pour déclencher l'upload de fichier
triggerFileUpload(): void {
  const fileInput = document.getElementById('conventionUpload') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

// Méthode pour obtenir la convention signée
getSignedConvention(): any {
  return this.conventions.find(conv => conv.type === 'convention signée');
}


isStageNotEncours(): boolean {
  return this.stage?.statut_stage?.toLowerCase() !== 'en cours';
}
}













































