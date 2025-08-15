import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConventionsGestion } from './conventions-gestion';

describe('ConventionsGestion', () => {
  let component: ConventionsGestion;
  let fixture: ComponentFixture<ConventionsGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConventionsGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConventionsGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
