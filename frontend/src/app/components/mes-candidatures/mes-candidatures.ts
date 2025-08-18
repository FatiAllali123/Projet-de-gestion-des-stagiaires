
import { Component, OnInit , Input , OnChanges , SimpleChanges} from '@angular/core';
import { CandidatureService, Candidature } from '../../services/candidature.service';
import{DatePipe, CommonModule}from '@angular/common';
import { FormsModule } from '@angular/forms';
import{ PropositionService } from '../../services/proposition.service';
import { EntretienService } from '../../services/entretien.service';
import { OffreService } from '../../services/offre.service';
@Component({
  selector: 'app-mes-candidatures',
  templateUrl: './mes-candidatures.html',
  styleUrls: ['./mes-candidatures.css'],
  imports : [DatePipe,CommonModule, FormsModule ]
})
export class MesCandidaturesComponent implements OnInit,OnChanges {
  candidatures: Candidature[] = [];
  filtreStatut: string = '';
  loading = false;
  errorMessage: string | null = null;


   // Variables pour la gestion des propositions
  propositions: any[] = [];
  propositionsTraitees: any[] = [];
  selectedProposition: any = null;
  selectedCandidature: any = null;
  commentaire = '';
  showPropositionsSection = false;
  activeTab: 'nonTraitees' | 'traitees' = 'nonTraitees';
  showPropositionsModal = false;
  constructor(private candidatureService: CandidatureService, private propositionService: PropositionService
    , private entretienService: EntretienService, private offreService: OffreService
  ) {}

   apiBaseUrl = 'http://localhost:3000/'; // adapter selon config serveur

   @Input() candidatureId?: number;
   @Input() entretienId?: number;
   @Input() offreId?: number;
  ngOnInit(): void {
    this.chargerCandidatures();
  }
    ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidatureId'] && this.candidatureId) {
      this.focusOnCandidature(this.candidatureId);
    }
     if (changes['entretienId'] && this.entretienId) {
      this.resolveEntretienToCandidature(this.entretienId);
    }
     if (changes['offreId'] && this.offreId) {
      this.resolveOffreToCandidature(this.offreId);
    }
  }
  
   private resolveEntretienToCandidature(entretienId: number): void {
    this.entretienService.getEntretienById(entretienId).subscribe({
      next: (entretien) => {
        if (entretien && entretien.candidature_id) {
          console.log('Candidature associée à entretien:', entretien.candidature_id);
          this.focusOnCandidature(entretien.candidature_id);
        }
      },
      error: (err) => {
        console.error('Erreur récupération entretien:', err);
      }
    });
  } 







     private resolveOffreToCandidature(offreId: number): void {
      if (offreId === undefined) return;

  // Si les candidatures sont déjà chargées
  if (this.candidatures.length > 0) {
    const candidaturesPourOffre = this.candidatures.filter(c => c.offre_id === offreId);
    
    if (candidaturesPourOffre.length > 0) {
      const candidatureEnCours = candidaturesPourOffre.find(c => 
        c.statut_candidature === "En cours d'execution");
      
      const candidature = candidatureEnCours || candidaturesPourOffre[0];
      if (candidature.id !== undefined) {
        this.focusOnCandidature(candidature.id);
      }
    }
    return;
  }
  } 

  
  chargerCandidatures(): void {
    this.loading = true;
    this.errorMessage = null;

    this.candidatureService.getMesCandidatures(this.filtreStatut).subscribe({
      next: (data) => {
        this.candidatures = data;
        this.loading = false;
        console.log('Candidatures chargées:', this.candidatures);
          // Après chargement, vérifier si on doit focus une candidature
        if (this.candidatureId) {
          this.focusOnCandidature(this.candidatureId);
        }
       if (this.entretienId) {
          this.resolveEntretienToCandidature(this.entretienId);
        }
         if (this.offreId !== undefined) {
          this.resolveOffreToCandidature(this.offreId);
        }
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement des candidatures.";
        this.loading = false;
      }
    });
  }

focusOnCandidature(candidatureId: number): void {
  // Si les candidatures sont déjà chargées
  if (this.candidatures.length > 0) {
    this.selectedCandidature = this.candidatures.find(c => c.id === candidatureId);
    this.scrollToCandidature(candidatureId);
      //Réinitialiser pour éviter que ça refasse le scroll après
    this.candidatureId = undefined;
  } else {
    // Si pas encore chargées, on retient l'ID et on scrollera après le chargement
    this.candidatureId = candidatureId;
  }
}

private scrollToCandidature(candidatureId: number): void {
  setTimeout(() => {
    const element = document.getElementById(`candidature-${candidatureId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Ajouter un highlight visuel
      element.classList.add('highlighted-candidature');
      setTimeout(() => {
        element.classList.remove('highlighted-candidature');
      }, 3000);
    }
  }, 100);
}

  
chargerPropositions(candidatureId: number): void {
  this.loading = true;
  this.selectedCandidature = this.candidatures.find(c => c.id === candidatureId);
  
  this.propositionService.getPropositionsByCandidature(candidatureId).subscribe({
    next: (propositions) => {
      this.propositions = propositions.filter(p => p.statut === 'en attente');
      this.propositionsTraitees = propositions.filter(p => p.statut !== 'en attente');
      this.showPropositionsModal = true;
      this.activeTab = this.propositions.length > 0 ? 'nonTraitees' : 'traitees';
      this.loading = false;
    },
    error: (err) => {
      this.errorMessage = "Erreur lors du chargement des propositions.";
      this.loading = false;
    }
  });
}

  
  selectProposition(proposition: any): void {
    this.selectedProposition = proposition;
    this.commentaire = '';
  }

  traiterProposition(action: 'accepter' | 'refuser'): void {
    if (!this.selectedProposition) return;

    this.loading = true;
    this.propositionService.traiterPeriode(
      this.selectedProposition.id,
      action,
      this.commentaire
    ).subscribe({
      next: () => {
              // Mettre à jour la candidature locale
      const candidatureIndex = this.candidatures.findIndex(c => c.id === this.selectedCandidature.id);
      if (candidatureIndex !== -1) {
        // Trouver la proposition dans la candidature
        const propositionIndex = this.candidatures[candidatureIndex].PropositionsDates!
          .findIndex((p: any) => p.id === this.selectedProposition.id);
        
        if (propositionIndex !== -1) {
          // Mettre à jour le statut de la proposition
          this.candidatures[candidatureIndex].PropositionsDates![propositionIndex].statut = 
            action === 'accepter' ? 'acceptée' : 'refusée';
          this.candidatures[candidatureIndex].PropositionsDates![propositionIndex].date_traitement = new Date().toISOString();
        }
      }

        // Recharger les propositions après traitement
        this.chargerPropositions(this.selectedCandidature.id);
        this.selectedProposition = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du traitement de la proposition';
        this.loading = false;
      }
    });
  }

  hasPendingPropositions(candidature: any): boolean {
    return candidature.PropositionsDates?.some((p: any) => p.statut === 'en attente');
  }

hasPlannedInterview(candidature: any): boolean {
  return candidature.statut_candidature === 'Entretien planifié' && 
         candidature.Entretiens && 
         candidature.Entretiens.length > 0 &&
         candidature.Entretiens[0].date_entretien;
}

formatTime(timeString: string): string {
  if (!timeString) return '';
  // Convertit "13:17:00" en "13:17"
  return timeString.split(':').slice(0, 2).join(':');
}

  appliquerFiltre(): void {
    this.chargerCandidatures();
  }

  resetFiltre(): void {
    this.filtreStatut = '';
    this.chargerCandidatures();
  }

  // Méthode pour obtenir URL publique du fichier
  getFileUrl(relativePath: string): string {
    if (!relativePath) return '';
    return this.apiBaseUrl + relativePath;
  }


  annulerCandidature(candidatureId: number): void {
  if (!confirm('Voulez-vous vraiment annuler cette candidature ?')) return;

  this.candidatureService.annulerCandidature(candidatureId).subscribe({
    next: () => {
      // Après annulation, on recharge la liste
      this.chargerCandidatures();
    },
    error: (err) => {
      console.error(err);
      alert("Erreur lors de l'annulation.");
    }
  });
}

getPropositionStatus(candidature: any): string {
  const propositions = candidature.PropositionsDates || [];
  
  const accepted = propositions.find((p: any) => p.statut === 'acceptée');
  if (accepted) {
    return `Période validée: du ${this.formatDate(accepted.date_debut_proposee)} au ${this.formatDate(accepted.date_fin_proposee)}`;
  }
  
  const pending = propositions.find((p: any) => p.statut === 'en attente');
  if (pending) {
    return 'Proposition en attente de traitement';
  }
  
  const refused = propositions.find((p: any) => p.statut === 'refusée');
  if (refused) {
    return 'Proposition refusée';
  }
  
  return 'Aucune proposition';
}

formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

hasAnyPropositions(candidature: any): boolean {
  return candidature.PropositionsDates?.length > 0;
}

hasAcceptedProposition(candidature: any): boolean {

  return candidature.PropositionsDates?.some((p: any) => p.statut === 'acceptée');
}

hasRefusedPropositions(candidature: any): boolean {
  return candidature.PropositionsDates?.some((p: any) => p.statut === 'refusée');
}

countPendingPropositions(candidature: any): number {
  return candidature.PropositionsDates?.filter((p: any) => p.statut === 'en attente').length || 0;
}

getAcceptedPropositionDate(candidature: any, type: 'debut' | 'fin'): string {
  const accepted = candidature.PropositionsDates?.find((p: any) => p.statut === 'acceptée');
  if (!accepted) return '';
  return this.formatDate(type === 'debut' ? accepted.date_debut_proposee : accepted.date_fin_proposee);
}


}
