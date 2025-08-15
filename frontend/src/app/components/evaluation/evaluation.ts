import { Component, OnInit } from '@angular/core';
import { StageService } from '../../services/stage.service';
import { EvaluationService } from '../../services/evaluation.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe , ReactiveFormsModule],
  templateUrl: './evaluation.html',
  styleUrls: ['./evaluation.css']
})
export class Evaluation implements OnInit {
  stages: any[] = [];
  selectedStage: any = null;
  loading = true;
  showModal = false;
  formSubmitted = false;

  evaluationForm: FormGroup;

  constructor(
    private stageService: StageService,
    private evaluationService: EvaluationService,
    private fb: FormBuilder
  ) {
    this.evaluationForm = this.fb.group({
      comportement: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      travail_equipe: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      qualite_travail: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      adaptable: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaire: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadStages();
  }

  loadStages(): void {
    this.loading = true;
    this.stageService.getStagesForEvaluation().subscribe({
      next: (stages) => {
        this.stages = stages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stages', err);
        this.loading = false;
      }
    });
  }

  openEvaluationModal(stage: any): void {
    this.selectedStage = stage;
    this.showModal = true;
    this.formSubmitted = false;
    this.resetForm();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStage = null;
  }

  setRating(criteria: string, rating: number): void {
    this.evaluationForm.get(criteria)?.setValue(rating);
  }

  resetForm(): void {
    this.evaluationForm.reset({
      comportement: 0,
      travail_equipe: 0,
      qualite_travail: 0,
      adaptable: 0,
      commentaire: ''
    });
  }

  submitEvaluation(): void {
    this.formSubmitted = true;
    
    if (this.evaluationForm.invalid) {
      return;
    }

    const evaluationData = {
      stage_id: this.selectedStage.id,
      encadrant_id: this.selectedStage.encadrant_id,
      ...this.evaluationForm.value
    };

    this.evaluationService.creerEvaluation(evaluationData).subscribe({
      next: () => {
        this.closeModal();
        this.loadStages(); // Rafraîchir la liste
      },
      error: (err) => {
        console.error('Error creating evaluation', err);
        // Gérer les erreurs ici (affichage message à l'utilisateur)
      }
    });
  }

  // Helper pour accéder facilement aux contrôles du formulaire
  get f() {
    return this.evaluationForm.controls;
  }
}