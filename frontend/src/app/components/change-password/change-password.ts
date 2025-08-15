import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePassword {
  changeForm: FormGroup;
  isLoading = false;
  passwordMismatch = false;
  errorMessage = '';
  successMessage = '';
  
  showPassword = {
    ancien: false,
    nouveau: false,
    confirmation: false
  };

  constructor(
    private fb: FormBuilder,
    private userService: UtilisateurService,
    public router: Router,
  ) {
    this.changeForm = this.fb.group({
      ancien_mot_de_pass: ['', Validators.required],
      nouveau_mot_de_pass: ['', Validators.required],
      confirmation_mot_de_pass: ['', Validators.required]
    });
  }

  onSubmit() {
    // Réinitialiser les messages
    this.passwordMismatch = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.changeForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const { ancien_mot_de_pass, nouveau_mot_de_pass, confirmation_mot_de_pass } = this.changeForm.value;

      if (nouveau_mot_de_pass !== confirmation_mot_de_pass) {
        this.passwordMismatch = true;
        this.isLoading = false;
        return;
      }

      this.userService.changePassword({ ancien_mot_de_pass, nouveau_mot_de_pass })
        .subscribe({
          next: (res) => {
            this.successMessage = 'Mot de passe changé avec succès!';
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000); // Redirection après 2 secondes
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 
                             (err.status === 401 ? 'Ancien mot de passe incorrect' : 
                              'Erreur lors du changement');
            this.isLoading = false;
          },
          complete: () => this.isLoading = false
        });
    }
  }

  togglePasswordVisibility(field: keyof typeof this.showPassword) {
    this.showPassword[field] = !this.showPassword[field];
  }
}