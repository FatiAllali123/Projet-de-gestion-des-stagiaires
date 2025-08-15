import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConventionCandidatComponent } from './convention-candidat.component';

describe('ConventionCandidatComponent', () => {
  let component: ConventionCandidatComponent;
  let fixture: ComponentFixture<ConventionCandidatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConventionCandidatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConventionCandidatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
