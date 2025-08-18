import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from '../../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators , ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.css']
})
export class StaffManagementComponent implements OnInit {
  staffList: any[] = [];
  
  error: string | null = null; 
  success: string | null = null;
  
  
 staffForm: FormGroup;
showCreateForm: boolean = false;
 selectedRole: string = ''; // '', 'rh', 'encadrant' 
  constructor(private utilisateurService: UtilisateurService,private fb: FormBuilder) {
 this.staffForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      role: ['rh', Validators.required],
      specialite: ['']
    });
     // Ajout de la validation conditionnelle pour la spécialité
    this.staffForm.get('role')?.valueChanges.subscribe(role => {
      const specialiteControl = this.staffForm.get('specialite');
      if (role === 'encadrant') {
        specialiteControl?.setValidators([Validators.required]);
      } else {
        specialiteControl?.clearValidators();
      }
      specialiteControl?.updateValueAndValidity();
    });

  }

  ngOnInit() {
    this.loadStaff();
  }


loadStaff() {
  console.log("role selectee ",this.selectedRole)
    this.utilisateurService.listStaffAccounts(this.selectedRole).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.staffList = response;
        } else if (response.message) {
          this.staffList = [];
          this.success = response.message;
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur de chargement';
        console.error(err);
      }
    });
  }


  onRoleFilterChange() {
    this.loadStaff();
  }


  createAccount() {
        if (this.staffForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.staffForm.markAllAsTouched();
      return;
    }
    const formData = this.staffForm.value;
    this.utilisateurService.createStaffAccount(formData).subscribe({
      next: (res) => {
        this.success = res.message;
        this.error = null;
        this.loadStaff();
        this.showCreateForm = false; // Fermer le formulaire après succès
        this.staffForm.reset({ role: 'rh' });
      },
      error: (err) => {
      

        if (err.error?.type === 'business') {
                this.error = err.error.error;
            } else {
                // Pour les erreurs techniques, log dans la console mais n'affichez pas à l'utilisateur
                console.error('Erreur technique:', err);
                this.error = "Une erreur est survenue. Veuillez réessayer plus tard.";
            }


        this.success = null;
        
        // Si c'est une erreur de validation avec plusieurs messages
        if (Array.isArray(err.error?.error)) {
          this.error = err.error.error.join(', ');
        }
      }
    });
}



  manage(id: number, action: 'disable' | 'enable' | 'delete') {
  if (action === 'delete') {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer ce compte ? 
                   \nCette action est irréversible et supprimera toutes les données associées a ce compte `);
    if (!confirmDelete) return; // Si l'utilisateur annule, on ne fait rien
  }

  this.utilisateurService.manageStaffAccount(id, action).subscribe({
    next: () => this.loadStaff(),
    error: (err) => alert(err.error?.error || 'Erreur')
  });
}

  toggleForm() {
  this.showCreateForm = !this.showCreateForm;
}


cancelForm() {
  this.showCreateForm = false;
}
}
