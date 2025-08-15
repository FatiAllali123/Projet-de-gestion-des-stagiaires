import { Component, Input, OnInit } from '@angular/core';
import { StageService } from '../../services/stage.service';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import{Router , RouterModule} from '@angular/router';
import { DatePipe } from '@angular/common'; // Ajout
import { DocumentService } from '../../services/document';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-conventions-component',
  imports: [CommonModule,RouterModule],
  templateUrl: './conventions.component.html',
  styleUrl: './conventions.component.css',
   providers: [DatePipe] // Ajout
})
export class ConventionsComponent implements OnInit {

  @Input() stageId!: number;
  @Output() back = new EventEmitter<void>();
 stage: any;
  loading = true;
    userRole: string | null = null;
  // conventions
  conventions: any[] = [];
  uploadingConvention = false;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  showConfirmation = false;

  stageTermine: boolean = false;
  

  
  //conventions
  conventionSignee: any = null;
  conventionsASigner: any[] = [];
  loadingConventions = false;
  conventionError: string | null = null;
  selectedConventionFile: File | null = null;
  showConventionsASigner = false;
  


   constructor(private auth: AuthService,
    private stageService: StageService,
    private userService: UtilisateurService,
 private router: Router,
    private fb: FormBuilder,
    private datePipe: DatePipe ,
    private documentservice: DocumentService,
    public documentService: DocumentService,
  ) {

  }


    ngOnInit() {
        this.auth.getCurrentUser().subscribe(user => {
      if (!user?.success) {
        this.router.navigate(['/login']);
        return;
      }

      this.userRole = user.role;});
    this.loadStageDetails();
    this.loadConventions(); // Ajout ici
  }
    // Vérifier si le stage est terminé
  checkStageStatus() {
    if (this.stage?.date_fin) {
      const aujourdHui = new Date();
      const dateFin = new Date(this.stage.date_fin);
      this.stageTermine = dateFin <= aujourdHui;
    }
  }
  loadStageDetails() {
    this.stageService.getStageDetails(this.stageId).subscribe({
      next: (response) => {
        this.stage = response;
          this.checkStageStatus(); // Vérifier l'état du stage
       
        
        this.loading = false;
        
        
      },
      error: (err) => {
        console.error('Error loading stage details', err);
        this.loading = false;
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

  // Ajout de la méthode pour formater les dates
  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }


  // Conventions

loadConventions() {
  this.documentservice.getAllConventions(this.stageId).subscribe({
    next: (data) => this.conventions = data,
    error: (err) => console.error('Erreur chargement conventions', err)
  });
}

traiterConvention(documentId: number, action: 'valider' | 'refuser') {
  Swal.fire({
   
    text: action === 'refuser' 
      ? 'Veuillez saisir un commentaire pour le refus (optionnel):'
      : 'Commentaire (optionnel) :',
    input: 'textarea',
    inputPlaceholder: 'Votre commentaire...',
    showCancelButton: true,
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#303f9f',
    cancelButtonColor: '#aaa',
    background: '#fff',
    customClass: {
      title: 'stage-title',
      input: 'stage-input',
    }
  }).then((result: import('sweetalert2').SweetAlertResult<any>) => {
    if (result.isConfirmed) {
      const commentaire = result.value || 
        (action === 'refuser' ? 'Refusé sans commentaire' : '');
      
      this.documentservice.processConvention(documentId, action, commentaire)
        .subscribe({
          next: () => this.loadConventions(),
          error: (err) => console.error('Erreur traitement convention', err)
        });
    }
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

showOtherConventions = false;

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

// Méthode pour obtenir les autres conventions (non signées)
getOtherConventions(): any[] {
  return this.conventions.filter(conv => conv.type !== 'convention signée');
}

// Méthode pour basculer l'affichage des autres conventions
toggleOtherConventions(): void {
  this.showOtherConventions = !this.showOtherConventions;
}

showCommentaire(commentaire: string) {
  Swal.fire({
    title: 'Commentaire ',
     
    text: commentaire,

    confirmButtonText: 'X',
    customClass: {
      confirmButton: 'my-confirm-btn'
    },
  
  });
}
getCommentaireTraite(conv: any): string {
  if (!conv.TraitementDocuments) return 'Aucun commentaire';

  const traitement = conv.TraitementDocuments.find((td: any) => td.action !== 'déposé');
  return traitement?.commentaire || 'Aucun commentaire';
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


  toggleConventionsASigner() {
  this.showConventionsASigner = !this.showConventionsASigner;
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




}













