
import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../../services/document';
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CandidatureService } from '../../services/candidature.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-conventions-gestion',
  imports: [DecimalPipe,CommonModule ,FormsModule],
  templateUrl: './conventions-gestion.html',
  styleUrl: './conventions-gestion.css'
})


export class ConventionsGestion implements OnInit {
  activeTab: 'a-signer' | 'signees' = 'a-signer';
  candidaturesAttente: any[] = [];
  selectedFiles: {[key: number]: File} = {}; // Stockage des fichiers par candidature ID
  isLoading = false;
  uploadProgress: {[key: number]: number} = {};
  message = '';
  messageType: 'success' | 'error' | null = null;

 showModal = false; // Ajouté pour gérer le modal
   candidaturesAcceptees: any[] = [];
  conventions: any[] = [];
  selectedCandidature: any = null;

conventionsSignees: any[] = [];

userRole: string = '';
 conventionsRH: any[] = []; // Pour les conventions à traiter par le RH
  selectedConventionRH: any = null;
  commentaireRH: string = '';


showSigneeModal = false;
selectedConventionForSignee: any = null;
signeeFile: File | null = null;
signeeUploadProgress = 0;
  
  constructor(private documentService: DocumentService,
    private candidatureService: CandidatureService,
    private authService: AuthService,
  
  ) {}

 ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userRole = user.role; // Supposons que le rôle est dans la réponse
        
        if (this.userRole === 'candidat') {
          this.loadCandidaturesAttente();
          this.loadCandidaturesAcceptees();
          this.loadConventionsSignees();
        } else if (this.userRole === 'rh') {
          this.loadConventionsRH();
          this.loadConventionsSigneesRH();
        }
      },
      error: (err) => console.error(err)
    });
  }
  loadConventionsRH(): void {
    this.isLoading = true;
    this.documentService.getConventionsASignerRH().subscribe({
      next: (response) => {
        this.conventionsRH = response.conventions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

   // Charger les conventions signées pour le RH
  loadConventionsSigneesRH(): void {
    this.isLoading = true;
    this.documentService.getConventionsSigneesRH().subscribe({
      next: (response) => {
        this.conventionsSignees = response.conventions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
/*
traiterConventionRH(convention: any, action: 'valider' | 'refuser'): void {
  Swal.fire({
    title: action === 'valider' ? 'Valider la convention' : 'Refuser la convention',
    input: 'textarea',
    inputPlaceholder: 'Écrivez un commentaire...',
    showCancelButton: true,
    confirmButtonText: action === 'valider' ? 'Valider' : 'Refuser',
    cancelButtonText: 'Annuler',
    confirmButtonColor: action === 'valider' ? '#4caf50' : '#f44336',
    cancelButtonColor: '#9e9e9e',
    preConfirm: (commentaire) => {
      if (!commentaire.trim()) {
        Swal.showValidationMessage('Le commentaire est obligatoire');
        return false;
      }
      return commentaire;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      const commentaire = result.value;

      this.documentService.processConvention(convention.id, action, commentaire).subscribe({
        next: () => {
          this.showMessage(
            `Convention ${action === 'valider' ? 'validée' : 'refusée'} avec succès`,
            'success'
          );
          this.loadConventionsRH();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.showMessage('Erreur lors du traitement de la convention', 'error');
          this.isLoading = false;
        }
      });
    }
  });
}*/


traiterConventionRH(convention: any, action: 'valider' | 'refuser'): void {
  if (action === 'valider') {
    // Ouvrir directement le modal de dépôt de convention signée
    this.openSigneeModal(convention);
  } else {
    // Pour le refus, garder l'ancien comportement
    this.processConventionAction(convention, action);
  }
}

private processConventionAction(convention: any, action: 'valider' | 'refuser'): void {
  Swal.fire({
    title: action === 'valider' ? 'Valider la convention' : 'Refuser la convention',
    input: action === 'refuser' ? 'textarea' : undefined,
    inputPlaceholder: action === 'refuser' ? 'Écrivez raison de refus(obligatoire)...' : '',
    showCancelButton: true,
    confirmButtonText: action === 'valider' ? 'Valider' : 'Refuser',
    cancelButtonText: 'Annuler',
    confirmButtonColor: action === 'valider' ? '#4caf50' : '#303f9f',
    cancelButtonColor: '#9e9e9e',
    preConfirm: (commentaire) => {
      if (action === 'refuser') {
        if (!commentaire || !commentaire.trim()) {
          Swal.showValidationMessage('Veuillez saisir un commentaire.');
          return false;
        }
        return commentaire;
      }
      return ''; // pas de commentaire pour valider
    }
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      const commentaire = result.value;

      this.documentService.processConvention(convention.id, action, commentaire).subscribe({
        next: () => {
          this.showMessage(
            `Convention ${action === 'valider' ? 'validée' : 'refusée'} avec succès`,
            'success'
          );
          this.loadConventionsRH();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.showMessage('Erreur lors du traitement de la convention', 'error');
          this.isLoading = false;
        }
      });
    }
  });
}


 





loadConventionsSignees(): void {
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.documentService.getConventionsSigneesByCandidat(user.id).subscribe({
          next: (response) => {
            this.conventionsSignees = response.conventions;
            this.isLoading = false;
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => console.error(err)
    });
  }


  loadCandidaturesAttente(): void {
    this.isLoading = true;
    this.documentService.getCandidaturesAttenteConvention().subscribe({
      next: (response) => {
        this.candidaturesAttente = response.candidatures;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement candidatures:', err);
        this.showMessage('Erreur lors du chargement des candidatures', 'error');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any, candidatureId: number): void {
    const file: File = event.target.files[0];
    if (file) {
      // Validation du fichier
      if (!this.validateFile(file)) {
        return;
      }
      this.selectedFiles[candidatureId] = file;
    }
  }

  validateFile(file: File): boolean {
    const allowedTypes = ['application/pdf', 
                        'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      this.showMessage('Type de fichier non supporté (PDF, DOC, DOCX uniquement)', 'error');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      this.showMessage('Le fichier ne doit pas dépasser 5MB', 'error');
      return false;
    }

    return true;
  }

  uploadConvention(candidatureId: number): void {
    const file = this.selectedFiles[candidatureId];
    if (!file) {
      this.showMessage('Veuillez sélectionner un fichier', 'error');
      return;
    }

    this.isLoading = true;
    this.uploadProgress[candidatureId] = 0;

    this.documentService.envoyerConvention(candidatureId, file).subscribe({
      next: (response) => {
        this.showMessage('Convention envoyée avec succès', 'success');
        delete this.selectedFiles[candidatureId];
        delete this.uploadProgress[candidatureId];
        this.loadCandidaturesAttente();
      },
      error: (err) => {
        console.error('Erreur envoi convention:', err);
        this.showMessage(`Erreur lors de l'envoi: ${err.error?.message || 'Erreur serveur'}`, 'error');
        this.isLoading = false;
        delete this.uploadProgress[candidatureId];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = null;
    }, 5000);
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }


  loadCandidaturesAcceptees(): void {
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.candidatureService.getMesCandidatures('Acceptée').subscribe({
          next: (candidatures) => {
            this.candidaturesAcceptees = candidatures;
            this.isLoading = false;
            console.log(candidatures);
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => console.error(err)
    });
  }

  openConventionsModal(candidature: any): void {
    this.selectedCandidature = candidature;
    this.isLoading = true;
    this.showModal = true;
    
    this.documentService.getConventionsASignerByCandidature(candidature.id).subscribe({
      next: (response) => {
        this.conventions = response.conventions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

// Ouvrir le modal de dépôt
openSigneeModal(convention: any): void {
  this.selectedConventionForSignee = convention;
  this.isLoading = false; // Pas besoin de charger le stage ici
  this.showSigneeModal = true;
}

// Gestion de la sélection du fichier
onSigneeFileSelected(event: any): void {
  const file: File = event.target.files[0];
  if (file && this.validateFile(file)) {
    this.signeeFile = file;
  }
}

// Envoyer la convention signée
uploadSigneeConvention(): void {
  if (!this.signeeFile || !this.selectedConventionForSignee) {
    this.showMessage('Veuillez sélectionner un fichier', 'error');
    return;
  }

  this.isLoading = true;
  this.signeeUploadProgress = 0;

  const formData = new FormData();
  formData.append('file', this.signeeFile);
  formData.append('type', 'convention signée');
  // On passe l'ID de la candidature associée à la convention à signer
  formData.append('candidature_id', this.selectedConventionForSignee.Candidature.id.toString());

  this.documentService.uploadDocument(formData).subscribe({
    next: (response) => {
      // Après dépôt réussi, valider la convention à signer
      this.documentService.processConvention(this.selectedConventionForSignee.id, 'valider').subscribe({
        next: () => {
          this.showMessage('Convention validée avec succès', 'success');
          this.closeSigneeModal();
          this.loadConventionsRH();
        },
        error: (err) => {
          console.error('Erreur validation convention:', err);
          this.showMessage('Erreur lors de la validation de la convention', 'error');
          this.isLoading = false;
        }
      });
    },
    error: (err) => {
      console.error('Erreur envoi convention signée:', err);
      this.showMessage(`Erreur lors de l'envoi: ${err.error?.message || 'Erreur serveur'}`, 'error');
      this.isLoading = false;
    }
  });
}

// Fermer le modal
closeSigneeModal(): void {
  this.showSigneeModal = false;
  this.selectedConventionForSignee = null;
  this.signeeFile = null;
  this.signeeUploadProgress = 0;
}
}