import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageDetailsEncadrantComponent } from './stage-details-encadrant.component';

describe('StageDetailsEncadrantComponent', () => {
  let component: StageDetailsEncadrantComponent;
  let fixture: ComponentFixture<StageDetailsEncadrantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageDetailsEncadrantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageDetailsEncadrantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
