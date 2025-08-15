import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncadrantStages } from './encadrant-stages';

describe('EncadrantStages', () => {
  let component: EncadrantStages;
  let fixture: ComponentFixture<EncadrantStages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncadrantStages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncadrantStages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
