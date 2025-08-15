

import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../../services/document';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
@Component({

  selector: 'app-rapport-gestion',
  imports: [CommonModule ,ReactiveFormsModule,FormsModule ],
  templateUrl: './rapport-gestion.html',
  styleUrl: './rapport-gestion.css'
})
export class RapportGestion {
rapports: any[] = [];
  loading = true;
  processing = false;
  commentaire = '';
  currentUserId!: number;
  constructor(private documentService: DocumentService, private authService : AuthService) {}

  ngOnInit() {
    
    this.authService.getCurrentUser().subscribe({
    next: (user) => {
       this.currentUserId = user.id; // stocke l'ID dans la propriété
        this.loadUntreatedReports(this.currentUserId); // charge les rapports avec cet ID
    },
    error: (err) => {
      console.error('Erreur lors de la récupération de l’utilisateur :', err);
    }
  });
    
  }

  loadUntreatedReports(encadrantId: number) {
    this.loading = true;
    this.documentService.getUntreatedReports(encadrantId).subscribe({
      next: (response) => {
        this.rapports = response.rapports;
        this.loading = false;
        console.log( this.rapports)
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rapports', err);
        this.loading = false;
      }
    });
  }

  traiterRapport(documentId: number, action: 'accepter' | 'refuser') {
console.log(documentId);
    this.processing = true;
    this.documentService.processReport(documentId, action, this.commentaire).subscribe({
      next: () => {
        this.processing = false;
        this.commentaire = '';
        // Recharger la liste après traitement
        this.loadUntreatedReports(this.currentUserId);
      },
      error: (err) => {
        console.error('Erreur lors du traitement', err);
        this.processing = false;
      }
    });
  }

  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'accepté':
        return 'accepte';
      case 'refusé':
        return 'refuse';
      default:
        return 'attente';
    }
  }
}


;
