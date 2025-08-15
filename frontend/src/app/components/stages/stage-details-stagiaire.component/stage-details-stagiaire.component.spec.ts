import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageDetailsStagiaireComponent } from './stage-details-stagiaire.component';

describe('StageDetailsStagiaireComponent', () => {
  let component: StageDetailsStagiaireComponent;
  let fixture: ComponentFixture<StageDetailsStagiaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageDetailsStagiaireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageDetailsStagiaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
