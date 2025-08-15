import { Component, OnInit, ViewChild , Input  , Output , EventEmitter} from '@angular/core';
import { CandidatureService } from '../../services/candidature.service';
import{ EntretienService } from '../../services/entretien.service';
import{ PropositionService } from '../../services/proposition.service';
import{ StageService } from '../../services/stage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm  } from '@angular/forms';
import{Router , RouterModule} from '@angular/router';
import { ListeOffresComponent } from './liste-offres/liste-offres.component';
import { EntretienModalComponent } from './entretien-modal/entretien-modal.component';
import { NgClass } from '@angular/common';

interface StageActifResponse {
  hasActiveStage: boolean;
  stages?: Array<{
    id: number;
    date_debut: string;
    date_fin: string;
    statut: 'Planifié' | 'En cours' | 'Terminé';
  }>;
  count?: number;
  message?: string;
}

// Ajoutez cette interface
interface PropositionDates {
  id: number;
  date_debut_proposee: string;
  date_fin_proposee: string;
  statut: string ;
  commentaire: string | null;
  date_proposition: string;
  date_traitement: string ;
}


@Component({
  selector: 'app-gestion-candidatures',
   standalone: true,
  templateUrl: './gestion-candidatures.component.html',
   styleUrl: './gestion-candidatures.component.css',
   imports: [CommonModule , FormsModule,  RouterModule  ,EntretienModalComponent,NgClass ],
})


export class GestionCandidaturesComponent implements OnInit {
  @ViewChild('entretienModal') entretienModal!: EntretienModalComponent;
   @ViewChild('stageForm') stageForm!: NgForm;
    errorMessage: string | null = null;
  @Input() offreId!: number;
  offreDetails: any = null;
  candidatures: any[] = [];
  loading = true;
  selectedCandidature: any;
  filterStatut = '';
  showStageModal = false;
  stageFormData = {
    sujet_stage: '',
    date_debut: '',
    date_fin: '',
    candidature_id: 0
  };
  candidaturesWithStages: any[] = []; 
  loadingAction: number | null = null;



  showPropositionModal = false;
showPropositionsList = false;
propositionFormData = {
  date_debut_proposee: '',
  date_fin_proposee: '',
  commentaire: '',
  candidature_id: 0
};
propositions: PropositionDates[] = [];
selectedCandidatureForPropositions: any;



@Output() back = new EventEmitter<void>();
  constructor(
    private stageService: StageService,
    private candidatureService: CandidatureService,
    private entretienService: EntretienService,
    private propositionService : PropositionService
  ) {}

ngOnInit() {
  console.log('ID de l’offre reçu :', this.offreId);
  this.loadData();
}
loadData() {
  console.log('Chargement des candidatures pour offre:', this.offreId);
  this.loading = true;
  this.candidatureService.getCandidaturesPourOffre(this.offreId, this.filterStatut).subscribe({
    next: (data) => {
      console.log('Données reçues du backend:', data);
      this.offreDetails = data.offre;
      
      // Utilisez directement les données du backend sans recharger les propositions
      this.candidatures = data.candidatures;
      
      // Log pour chaque candidature
      this.candidatures.forEach((candidature, index) => {
        console.log(`Candidature ${index}:`, candidature);
        console.log(`Statut: ${candidature.statut_candidature}`);
        console.log(`PropositionsDates:`, candidature.PropositionsDates);
      });
      
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur lors du chargement:', err);
      this.loading = false;
    }
  });
}

onFilterChange() {
    this.loadData();
  }

openEntretienModal(entretien?: any) {
  this.entretienModal.open(entretien);


}
 


handlePlanifierEntretien(event: any) {
  this.errorMessage = null;
 
  const { candidatureId, entretienId, formData, isEdit } = event;

  if (isEdit && entretienId) {
    // Modifier un entretien existant
    this.entretienService.modifierEntretien(entretienId, formData).subscribe({
      next: () => {
        this.loadData();
         this.loadingAction = null; // Fin chargement
        this.entretienModal.close();


      },
      error: (err) => {
        this.handleError(err);
   
      }
    });
  } else {
    // Planifier un nouvel entretien
    this.entretienService.planifierEntretien(candidatureId, formData).subscribe({
      next: () => {
        this.loadData();
        this.entretienModal.close();
    
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }
}

handleError(err: any) {
  if (err.status === 400) {
    this.errorMessage = err.error?.message || 'Données invalides';
  } else {
    this.errorMessage = 'Une erreur est survenue';
  }
  console.error(this.errorMessage, err);
}


 handleCreerStage(candidature: any) {
    this.stageFormData = {
      sujet_stage: '',
      date_debut: '',
      date_fin: '',
      candidature_id: candidature.id
    };
    this.showStageModal = true;
  }
 submitStageForm() {
    // Vérification supplémentaire côté TypeScript
    if (!this.stageForm.valid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.errorMessage = null;
    this.stageService.creerStage(this.stageFormData).subscribe({
      next: (res) => {
        alert("Stage créé avec succès !");
        this.loadData();
        this.showStageModal = false;
      },
      error: (err) => {
        console.error("Erreur lors de la création du stage :", err);
        if (err.status === 400) {
          this.errorMessage = err.error?.message || 'Données invalides pour la création du stage';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la création du stage';
        }
      }
    });
  }

  closeStageModal() {
    this.showStageModal = false;
  }

 accepter(id: number) {
    this.errorMessage = null;
     this.loadingAction = id;  // Début chargement
  this.candidatureService.accepterCandidature(id).subscribe({
    next: () => {
      console.log('Candidature ${id} acceptée');
      this.loadData(); // recharge la liste
         this.loadingAction = null; // Fin chargement
    },
     error: (err) => {
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Impossible d\'accepter cette candidature';
      }
      console.error(err);
       this.loadingAction = null; // Fin chargement même en erreur
    }
  });
}

refuser(id: number) {
  this.errorMessage = null;
       this.loadingAction = id;  // Début chargement
  this.candidatureService.refuserCandidature(id).subscribe({
    next: () => {
      console.log('Candidature ${id} refusée');
      this.loadData();
           this.loadingAction = null; // Fin chargement
    },
      error: (err) => {
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Impossible de refuser cette candidature';
      }
      console.error(err);
           this.loadingAction = null; // Fin chargement
    }
  });
}

preselectionner(id: number) {
  this.errorMessage = null;
    this.loadingAction = id;  // Début chargement
  this.candidatureService.preselectionnerCandidature(id).subscribe({
    next: () => {
      console.log('Candidature ${id} préselectionnée');
      this.loadData();
       this.loadingAction = null; // Fin chargement
    },
    error: (err) => {
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Impossible de présélectionner cette candidature';
      }
      console.error(err);
       this.loadingAction = null; // Fin chargement
    }
  });
}


/*
getActions(candidature: any): string[] {

  const statut = candidature.statut_candidature;
  console.log('Statut de la candidature:', statut);
  const entretienRequis = this.offreDetails?.entretien_requis;
  console.log('Entretien requis:', entretienRequis);
  const entretien = candidature.Entretiens?.[0];

  
  if (!entretienRequis) {
    // Pas d'entretien requis : afficher actions selon le statut
    if (statut === 'En cours d\'execution') {
      return ['Accepter', 'Refuser'];
    } else {
      // Statut accepté ou refusé ou autre, pas d'action possible
      return [];
    }
  }

  switch (statut) {
    case 'En cours d\'execution':
      return ['Presélectionner', 'Refuser'];
    case 'Presélectionnée':
      return ['Planifier entretien'];
    case 'Entretien planifié':
      if (!entretien) return [];
      if (entretien.statut === 'Planifié') {
        return ['Modifier entretien', 'Annuler entretien', 'Terminer entretien'];
      }
      if (entretien.statut === 'Passé') {
        return ['Accepter', 'Refuser'];
      }
    
      return [];
      case 'Acceptée':
       // Afficher "Créer Stage" seulement si aucun stage n'existe
       return candidature.Stage ? [] : ['Creer Stage'];
    
    default:
      return [];
  }
}
*/
handleCandidatureAction(event: { action: string, candidature: any }) {
  const { action, candidature } = event;

  switch (action) {
    case 'Accepter':
      this.accepter(candidature.id);
      break;
    case 'Refuser':
      this.refuser(candidature.id);
      break;
      case 'Proposer Période':
      this.handleProposerPeriode(candidature);
      break;
    case 'Voir Propositions':
      this.voirPropositions(candidature);
      break;
    case 'Presélectionner':
      this.preselectionner(candidature.id);
      break;
    case 'Planifier entretien':
    case 'Modifier entretien':
      const entretien = candidature.Entretiens?.[0];
      const entretienEstActif = entretien && entretien.statut !== 'Annulé';
     this.selectedCandidature = candidature;
      this.entretienModal.candidature = candidature; // important pour récupérer l'id
      this.openEntretienModal(entretienEstActif ? entretien : undefined); // ← évite de modifier un annulé
      break;
    case 'Annuler entretien':
  this.errorMessage = null;
  this.entretienService.annulerEntretien(candidature.Entretiens[0].id).subscribe({
    next: () => this.loadData(),
    error: (err) => {
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Impossible d\'annuler cet entretien';
      }
      console.error(err);
    }
  });
  break;

// Modifiez le case 'Terminer entretien' dans handleCandidatureAction
case 'Entretien est passée':
  this.errorMessage = null;
  this.entretienService.terminerEntretien(candidature.Entretiens[0].id).subscribe({
    next: () => this.loadData(),
    error: (err) => {
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Impossible de terminer cet entretien';
      }
      console.error(err);
    }
  });
  break;
      case 'Creer Stage':  
     this.handleCreerStage(candidature);
       break;
  }
}
 goBack() {
    this.back.emit();
  }



  isEntretienPast(candidature: any, action: string): boolean {
  const entretien = candidature.Entretiens?.[0];
  if (!entretien) return false; // pas d'entretien = pas disabled

  // On parse la date et l'heure de l'entretien
  const dateEntretienStr = entretien.date_entretien; // ex: '2025-08-11'
  const heureEntretienStr = entretien.heure_entretien; // ex: '14:30'

  if (!dateEntretienStr || !heureEntretienStr) return false;

  // Construire un Date objet pour la date+heure de l'entretien
  const [hours, minutes] = heureEntretienStr.split(':').map(Number);
  const entretienDate = new Date(dateEntretienStr);
  entretienDate.setHours(hours, minutes, 0, 0);

  const now = new Date();

  // Désactive seulement pour ces actions
  if ((action === 'Modifier entretien' || action === 'Annuler entretien') && now > entretienDate) {
    return true; // entretien passé => disable
  }

  return false; // pas disable sinon
}

handleProposerPeriode(candidature: any) {
  this.propositionFormData = {
    date_debut_proposee: '',
    date_fin_proposee: '',
    commentaire: '',
    candidature_id: candidature.id
  };
  this.showPropositionModal = true;
}


submitPropositionForm() {
  this.errorMessage = null;

   console.log("FormData avant envoi :", this.propositionFormData);
     this.propositionFormData.date_debut_proposee = new Date(this.propositionFormData.date_debut_proposee).toISOString().split('T')[0];
  this.propositionFormData.date_fin_proposee = new Date(this.propositionFormData.date_fin_proposee).toISOString().split('T')[0];
     console.log("FormData apres envoi :", this.propositionFormData);
    this.propositionFormData.date_debut_proposee = new Date(this.propositionFormData.date_debut_proposee).toISOString().split('T')[0];
  this.propositionFormData.date_fin_proposee = new Date(this.propositionFormData.date_fin_proposee).toISOString().split('T')[0];
  this.propositionService.proposerPeriode(this.propositionFormData).subscribe({
    next: (res) => {
      alert("Période proposée avec succès !");
      this.loadData();
      this.showPropositionModal = false;
    },
    error: (err) => {
      console.error("Erreur lors de la proposition de période :", err);
      if (err.status === 400) {
        this.errorMessage = err.error?.message || 'Données invalides pour la proposition de période';
      } else {
        this.errorMessage = 'Une erreur est survenue lors de la proposition de période';
      }
    }
  });
}



closePropositionModal() {
  this.showPropositionModal = false;
}

voirPropositions(candidature: any) {
  this.selectedCandidatureForPropositions = candidature;
  this.propositionService.getPropositionsByCandidature(candidature.id).subscribe({
    next: (propositions) => {
      this.propositions = propositions;
      this.showPropositionsList = true;
    },
    error: (err) => {
      console.error("Erreur lors de la récupération des propositions :", err);
      this.errorMessage = 'Erreur lors de la récupération des propositions';
    }
  });
}


closePropositionsList() {
  this.showPropositionsList = false;
}


// Retourne true si une proposition acceptée existe pour cette candidature
hasAcceptedProposition(candidature: any): boolean {
  console.log('=== DEBUG hasAcceptedProposition ===');
  console.log('Candidature ID:', candidature.id);
  console.log('PropositionsDates brut:', candidature.PropositionsDates);
  
  if (!candidature.PropositionsDates || !Array.isArray(candidature.PropositionsDates)) {
    console.log('Pas de PropositionsDates ou pas un tableau');
    return false;
  }

  console.log('Nombre de propositions:', candidature.PropositionsDates.length);
  
  // Vérifiez chaque proposition individuellement
  for (let i = 0; i < candidature.PropositionsDates.length; i++) {
    const proposition = candidature.PropositionsDates[i];
    console.log(`Proposition ${i}:`, proposition);
    console.log(`Statut proposition ${i}:`, proposition.statut);
    console.log(`Statut en lowercase:`, proposition.statut?.toLowerCase());
    
    if (proposition.statut?.toLowerCase() === 'acceptée' || 
        proposition.statut?.toLowerCase() === 'acceptee') {
      console.log('Proposition acceptée trouvée!');
      return true;
    }
  }
  
  console.log('Aucune proposition acceptée trouvée');
  return false;
}


// Modifiez la méthode getActions
getActions(candidature: any): string[] {
  const statut = candidature.statut_candidature;
  const entretienRequis = this.offreDetails?.entretien_requis;
  const entretien = candidature.Entretiens?.[0];
  const hasAcceptedProposition = this.hasAcceptedProposition(candidature);
  
  console.log('=== DEBUG CANDIDATURE ===');
  console.log('Candidature ID:', candidature.id);
  console.log('Statut:', statut);
  console.log('Entretien requis:', entretienRequis);
  console.log('PropositionsDates:', candidature.PropositionsDates);
  console.log('hasAcceptedProposition:', hasAcceptedProposition);
  console.log('========================');

  // PROBLÈME ICI : vous sortez trop tôt quand entretien_requis = false
  if (!entretienRequis) {
    // Gérer aussi le cas "Acceptée" même quand pas d'entretien requis
    if (statut === 'En cours d\'execution') {
      return ['Accepter', 'Refuser'];
    } else if (statut === 'Acceptée' || statut === 'acceptee') {
      console.log('Candidature acceptée détectée (pas d\'entretien requis)');
      if (hasAcceptedProposition) {
        console.log('Proposition acceptée existante');
        return ['Voir Propositions'];
      }
      console.log('Aucune proposition acceptée, affichage des boutons');
      return ['Proposer Période', 'Voir Propositions'];
    } else {
      return [];
    }
  }

  // Logique pour quand entretien requis = true
  switch (statut) {
    case 'En cours d\'execution':
      return ['Presélectionner', 'Refuser'];
    case 'Presélectionnée':
      return ['Planifier entretien'];
    case 'Entretien planifié':
      if (!entretien) return [];
      if (entretien.statut === 'Planifié') {
        return ['Modifier entretien', 'Annuler entretien', 'Entretien est passée'];
      }
      if (entretien.statut === 'Passé') {
        return ['Accepter', 'Refuser'];
      }
      return [];
    case 'Acceptée':
    case 'acceptee':
      console.log('Candidature acceptée détectée (entretien requis)');
      if (hasAcceptedProposition) {
        console.log('Proposition acceptée existante');
        return ['Voir Propositions'];
      }
      console.log('Aucune proposition acceptée, affichage des boutons');
      return ['Proposer Période', 'Voir Propositions'];
    
    default:
      console.log('Statut non géré:', statut);
      return [];
  }
}


getAcceptedPeriod(candidature: any): string {
  const acceptedProp = candidature.PropositionsDates?.find((p: any) => p.statut.toLowerCase() === 'acceptée');
  if (!acceptedProp) return '';
  
  const startDate = new Date(acceptedProp.date_debut_proposee);
  const endDate = new Date(acceptedProp.date_fin_proposee);
  
  return `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
}



}  