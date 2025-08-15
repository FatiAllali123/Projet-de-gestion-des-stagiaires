import { Component, OnInit } from '@angular/core';
import { CandidatureService, Candidature } from '../../services/candidature.service';
import{DatePipe, CommonModule}from '@angular/common';
import { FormsModule } from '@angular/forms';
import{ PropositionService } from '../../services/proposition.service';
@Component({
  selector: 'app-mes-candidatures',
  templateUrl: './mes-candidatures.html',
  styleUrls: ['./mes-candidatures.css'],
  imports : [DatePipe,CommonModule, FormsModule ]
})
export class MesCandidaturesComponent implements OnInit {
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
  constructor(private candidatureService: CandidatureService, private propositionService: PropositionService) {}

   apiBaseUrl = 'http://localhost:3000/'; // adapter selon config serveur
  ngOnInit(): void {
    this.chargerCandidatures();
  }

  chargerCandidatures(): void {
    this.loading = true;
    this.errorMessage = null;

    this.candidatureService.getMesCandidatures(this.filtreStatut).subscribe({
      next: (data) => {
        this.candidatures = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement des candidatures.";
        this.loading = false;
      }
    });
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
  
  console.log(candidature.PropositionsDates?.some((p: any) => p.statut === 'acceptée'));
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
