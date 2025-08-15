import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCandidaturesComponent } from './gestion-candidatures.component';

describe('GestionCandidaturesComponent', () => {
  let component: GestionCandidaturesComponent;
  let fixture: ComponentFixture<GestionCandidaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCandidaturesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCandidaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
