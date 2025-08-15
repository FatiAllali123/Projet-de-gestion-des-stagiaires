import { Component,  Output , EventEmitter , ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule , Router } from '@angular/router';
import{ FormBuilder, FormGroup, Validators , ReactiveFormsModule} from '@angular/forms';
// entretien-modal.component.ts
@Component({
  selector: 'app-entretien-modal',
  templateUrl: './entretien-modal.component.html',
  styleUrl:'./entretien-modal.component.css',
  imports: [CommonModule, RouterModule , ReactiveFormsModule],
})
export class EntretienModalComponent {
  @Output() onSubmit = new EventEmitter<any>();

  @Input() candidature: any;
  entretienForm: FormGroup;
  isEdit = false;
 isOpen = false; // Ajoute cette propriété
 entretienId: number | null = null;
  constructor(private fb: FormBuilder) {
    this.entretienForm = this.fb.group({
      date_entretien: ['', Validators.required],
      heure_entretien: ['', Validators.required]
    });
  }

  open(entretien?: any) {
  this.isOpen = true;
  this.isEdit = !!entretien;

  if (entretien) {
    this.entretienId = entretien.id; // <-- stocker l'ID
    this.entretienForm.patchValue({
      date_entretien: entretien.date_entretien,
      heure_entretien: entretien.heure_entretien
    });
  } else {
    this.entretienId = null;
    this.entretienForm.reset();
  }
}

  close() {
    this.isOpen = false; 
 
  }

 

  /*submit() {
  if (this.entretienForm.valid) {
    // Émet à la fois les données du formulaire ET l'ID de candidature
    this.onSubmit.emit({
      formData: this.entretienForm.value,
      candidatureId: this.candidature?.id
    });
  }
}*/

submit() {
  const formData = this.entretienForm.value;
  this.onSubmit.emit({
    candidatureId: this.candidature.id,
    entretienId: this.entretienId, // <-- ajouté
    formData: formData,
    isEdit: this.isEdit
  });
}

}