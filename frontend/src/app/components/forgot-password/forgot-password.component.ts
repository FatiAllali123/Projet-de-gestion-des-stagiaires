import { Component } from '@angular/core';
import { ResetPasswordService } from '../../services/reset-password.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
   imports: [FormsModule , RouterModule , ReactiveFormsModule ,CommonModule  ],
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  message: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private resetService: ResetPasswordService,
    private fb: FormBuilder
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.resetService.requestReset(this.forgotForm.value.email).subscribe({
        next: (response) => {
          this.message = response.message;
          this.error = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.error.error || 'Une erreur est survenue';
          this.message = '';
          this.isLoading = false;
        }
      });
    }
  }
}