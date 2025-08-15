import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Router , RouterModule} from '@angular/router';
import { User } from '../../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ProfilComponent implements OnInit {
  profileForm: FormGroup;
  userProfile!: User;
  isLoading = false;
  isEditing = false;
  
  successMessage: string | null = null;
errorMessage: string | null = null;
  constructor(
    private fb: FormBuilder,
    private userService: UtilisateurService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      specialite_encadrant: [''],
      telephone: [''],
      niveau_etudes: [''],
      etablissement: [''],
   
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          nom: profile.nom,
          prenom: profile.prenom,
          specialite_encadrant: profile.specialite_encadrant || '',
           telephone: profile.telephone || '',
          niveau_etudes: profile.niveau_etudes || '',
          etablissement: profile.etablissement || '',
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        alert('Erreur lors du chargement du profil');
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileForm.reset();
      this.loadUserProfile();
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const formData = this.profileForm.value;

      // On envoie seulement les données nécessaires selon le rôle
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        ...(this.userProfile.role === 'encadrant' && {
          specialite_encadrant: formData.specialite_encadrant
        }),
        telephone: formData.telephone,
        niveau_etudes: formData.niveau_etudes,
        etablissement: formData.etablissement,
      };

      this.userService.updateProfile(updateData).subscribe({
        next: () => {
         this.successMessage = 'Profil mis à jour avec succès ';
        this.errorMessage = null;
          this.isEditing = false;
           this.isLoading = false;
          this.loadUserProfile(); // Recharger les données
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour ';
        this.successMessage = null;
        this.isLoading = false;
    
        }
      });
    }
  }


  closeMessage(type: 'success' | 'error'): void {
  if (type === 'success') this.successMessage = null;
  else this.errorMessage = null;
}
}