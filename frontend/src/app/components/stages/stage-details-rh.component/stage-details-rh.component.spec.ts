import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageDetailsRhComponent } from './stage-details-rh.component';

describe('StageDetailsRhComponent', () => {
  let component: StageDetailsRhComponent;
  let fixture: ComponentFixture<StageDetailsRhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageDetailsRhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageDetailsRhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
