import { Component, OnInit } from '@angular/core';
import { OffreService, Offre } from '../../services/offre.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-gestion-offres',
  standalone: true,
  templateUrl: './gestion-offres.html',
  styleUrls: ['./gestion-offres.css'],
  imports: [CommonModule , FormsModule],
  providers: [OffreService]
})
export class GestionOffresComponent implements OnInit {
  offres: Offre[] = [];
  filteredOffres: Offre[] = [];
  error: string | null = null;
  success: string | null = null;

  showCreateForm = false;
  editingOffre: Offre | null = null;
  viewingOffre: Offre | null = null;

     // Filtres
  filters = {
    statut: '',
    type: '',
    mode: '',
   
  };

  formulaire: any = {
  titre: '',
  description: '',
  competences_requises: '',
  duree: '',
  dateDebutApprox: '',
  mode_stage: 'présentiel',
  type_stage: 'PFE',
  entretien_requis: false

};


  // Options pour les selects
  statutOptions = [
    { value: '', label: 'Tous statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' }
  ];

  typeOptions = [
    { value: '', label: 'Tous types' },
    { value: 'PFE', label: 'PFE' },
    { value: 'PFA', label: 'Stage PFA' },
    { value: 'Observation', label: 'Observation' },
    { value: 'Initiation', label: 'Initiation' }
  ];

  modeOptions = [
    { value: '', label: 'Tous modes' },
    { value: 'Présentiel', label: 'Présentiel' },
    { value: 'Distanciel', label: 'Distanciel' },
    { value: 'Hybride', label: 'Hybride' }
  ];
 loading = false;
  constructor(private offreService: OffreService) {}

  ngOnInit(): void {
    this.chargerOffres();
  }

  chargerOffres() {
     this.loading = true;
    this.offreService.getAllOffres().subscribe({
      next: (data) => {
        this.offres = data;
        this.filteredOffres = [...this.offres];
        this.loading = false;
      },
      error: (err) =>
        (this.error = err.error?.message || 'Erreur lors du chargement')
    });
  }


  appliquerFiltres() {
    this.filteredOffres = this.offres.filter(offre => {
      // Filtre par statut
      if (this.filters.statut && offre.statut_offre !== this.filters.statut) {
        return false;
      }
      
      // Filtre par type
      if (this.filters.type && offre.type_stage !== this.filters.type) {
        return false;
      }
      
      // Filtre par mode
      if (this.filters.mode && offre.mode_stage !== this.filters.mode) {
        return false;
      }
      
  
      
      return true;
    });
  }

  reinitialiserFiltres() {
    this.filters = {
      statut: '',
      type: '',
      mode: ''

    };
    this.filteredOffres = [...this.offres];
  }
ouvrirFormulaire(offre?: Offre) {
  this.showCreateForm = true;
  if (offre) {
    this.editingOffre = offre;
    this.formulaire = { ...offre }; // copier les valeurs de l'offre dans le formulaire
  } else {
    this.editingOffre = null;
    this.formulaire = {
      titre: '',
      description: '',
      competences_requises: '',
      duree: '',
      dateDebutApprox: '',
      mode_stage: 'présentiel',
      type_stage: 'PFE',
      entretien_requis: false
    };
  }
}

// Méthode pour ouvrir la vue détails
ouvrirDetails(offre: Offre) {
  this.viewingOffre = { ...offre };
}
annuler() {
  this.formulaire = {
    titre: '',
    description: '',
    competences_requises: '',
    duree: '',
    mode_stage: 'présentiel',
    type_stage: 'PFE',
    entretien_requis: false,
    dateDebutApprox: ''
  };
  this.editingOffre = null;
  this.viewingOffre = null;
  this.showCreateForm = false;
  this.success = null;
  this.error = null;
}

soumettreFormulaire(form: NgForm) {
  // Validation du formulaire
  if (form.invalid) {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
    return;
  }

  // Logique de soumission existante
  if (this.editingOffre) {
    this.offreService.updateOffre(this.editingOffre.id!, this.formulaire).subscribe({
      next: (res) => {
        this.success = res.message;
        this.annuler();
        this.chargerOffres();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la modification';
        console.error('Erreur détaillée:', err);
      }
    });
  } else {
    this.offreService.createOffre(this.formulaire).subscribe({
      next: (res) => {
        this.success = res.message;
        this.annuler();
        this.chargerOffres();
      },
      error: (err) => (this.error = err.error?.message || 'Erreur lors de la création')
    });
  }
}

  supprimerOffre(id: number) {
    const confirmDelete = confirm("Es-tu sûr de vouloir supprimer cette offre ?");
    if (!confirmDelete) return;

    this.offreService.deleteOffre(id).subscribe({
      next: (res) => {
        this.success = res.message;
        this.chargerOffres();
      },
      error: (err) =>
        (this.error = err.error?.message || 'Erreur lors de la suppression')
    });
  }

  activerDesactiverOffre(offre: Offre) {
    const action = offre.statut_offre === 'actif' ? 'deactivate' : 'activate';
    this.offreService.toggleOffreStatus(offre.id!, action).subscribe({
      next: (res) => {
        this.success = res.message;
        this.chargerOffres();
      },
      error: (err) =>
        (this.error = err.error?.message || 'Erreur lors du changement de statut')
    });
  }


  
}
