import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntretienModalComponent } from './entretien-modal.component';

describe('EntretienModalComponent', () => {
  let component: EntretienModalComponent;
  let fixture: ComponentFixture<EntretienModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntretienModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntretienModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
