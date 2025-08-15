import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResetPasswordService } from '../../services/reset-password.service';
import { ReactiveFormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports:[ReactiveFormsModule ,CommonModule]
})
export class ResetPasswordComponent implements OnInit {
  token!: string;
  form!: FormGroup;
  isValidToken: boolean = false;
  isLoading: boolean = true;
  message: string = '';
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private resetService: ResetPasswordService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.verifyToken();
  }

  verifyToken(): void {
    this.resetService.verifyToken(this.token).subscribe({
      next: (res) => {
        this.isValidToken = res.valid;
        this.buildForm();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Le lien est invalide ou a expiré.';
        this.isLoading = false;
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordsMatch
    });
  }

  passwordsMatch(group: FormGroup) {
    const pass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { notMatching: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const newPassword = this.form.get('newPassword')?.value;
    this.resetService.resetPassword(this.token, newPassword).subscribe({
      next: (res) => {
        this.message = res.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de la réinitialisation.';
      }
    });
  }
}
