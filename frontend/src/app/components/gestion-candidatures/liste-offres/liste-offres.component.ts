
import { OffreService } from '../../../services/offre.service';
import { Component, OnInit , Output , EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule , Router } from '@angular/router';
import { GestionCandidaturesComponent } from '../gestion-candidatures.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-liste-offres',
  
  templateUrl: './liste-offres.component.html', 
   styleUrls: ['./liste-offres.component.css'],
  imports : [CommonModule, RouterModule,FormsModule],
})
export class ListeOffresComponent implements OnInit {
  offres: any[] = [];
    filteredOffres: any[] = []; // Nouvelle propriété pour les offres filtrées
  loading = true;
  currentFilter = 'actif'; // Valeur par défaut
    filterOptions = [
    { value: 'actif', label: 'Offres actives' },
    { value: 'inactif', label: 'Offres inactives' },
    { value: 'tous', label: 'Toutes les offres' }
  ];

@Output() offreSelected = new EventEmitter<number>(); 

  errorMessage: string | null = null;
  noOffersAvailable = false;

  constructor(private offreService: OffreService) {}

  ngOnInit() {
    this.loadOffresRH();
  }

 loadOffresRH() {
    this.loading = true;
    this.errorMessage = null;
    this.noOffersAvailable = false;

    this.offreService.getAllOffres().subscribe({
      next: (data) => {
        this.offres = data;
      
        this.applyFilter(); // Applique le filtre après chargement
        this.noOffersAvailable = data.length === 0;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        
        if (err.status === 400) {
          this.errorMessage = err.error?.message || 'Erreur lors du chargement des offres';
        } else if (err.status === 404) {
          this.noOffersAvailable = true;
        } else {
          this.errorMessage = 'Une erreur est survenue lors du chargement des offres';
        }
      }
    });
  }

   // Méthode pour appliquer le filtre
  applyFilter() {
    if (this.currentFilter === 'tous') {
      this.filteredOffres = [...this.offres];
    } else {
      this.filteredOffres = this.offres.filter(offre => 
        offre.statut_offre === this.currentFilter
      );
    }
  }

  // Méthode appelée quand le filtre change
  onFilterChange() {
    this.applyFilter();
    this.noOffersAvailable = this.filteredOffres.length === 0;
  }



}