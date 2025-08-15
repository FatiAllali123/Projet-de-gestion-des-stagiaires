import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import{ RouterModule, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [FormsModule, RouterModule,CommonModule ],
})
export class SignupComponent {
  form = {
    nom: '',
    prenom: '',
    email: '',
    mot_de_pass: '',
     telephone: '',         // Nouveau champ optionnel
    niveau_etudes: '',     // Nouveau champ optionnel
    etablissement: '' 
  };

  message = '';
 
messageType: 'success' | 'error' = 'error'; // ou 'success' selon le cas
  constructor(private authService: AuthService) {}

  onSubmit(form: any) {
    if (form.invalid) {
      this.message = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    this.authService.signup(this.form).subscribe({
      next: (res) => {
        this.message = 'Inscription réussie !';
        this.messageType = 'success';
        form.resetForm(); // Réinitialiser le formulaire
      },
      error: (err) => {
        this.message = err.error?.error || 'Erreur lors de l’inscription';
        this.messageType = 'error';
      }
    });
  }
}
