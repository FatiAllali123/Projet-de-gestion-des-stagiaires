
import { Component , Output , EventEmitter} from '@angular/core';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-encadrant-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './encadrant-list.html',
  styleUrl: './encadrant-list.css'
})
export class EncadrantList{
  encadrants: any[] = [];
  searchTerm = '';
  loading = true;
  @Output() encadrantSelected = new EventEmitter<number>();


  constructor(
    private utilisateurService: UtilisateurService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEncadrants();
  }

  loadEncadrants() {
    this.loading = true;
    this.utilisateurService.getEncadrants(this.searchTerm).subscribe({
      next: (data) => {
        this.encadrants = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  viewStages(encadrantId: number) {
    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        section: 'comptes',
        encadrantId: encadrantId 
      }
    });
  }

  selectEncadrant(encadrantId: number) {
  
  this.encadrantSelected.emit(encadrantId);
}

}