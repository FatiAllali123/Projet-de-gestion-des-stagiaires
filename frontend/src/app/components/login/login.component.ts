import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import { RouterModule ,  Router} from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule , RouterModule , CommonModule],
})
export class LoginComponent {
  credentials = {
    email: '',
    mot_de_pass: ''
  };

  message = '';
  messageType: 'success' | 'error' = 'error'; // ou 'success' selon le cas
  token = '';

  constructor(private authService: AuthService , private router: Router) {}

  onSubmit() {
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.token = res.token;
        localStorage.setItem('token', this.token);
        this.message = 'Connexion réussie';
        this.messageType = 'success';
         this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.message = err.error?.error || 'Erreur de connexion';
        this.messageType = 'error';
      }
    });
  }
}
