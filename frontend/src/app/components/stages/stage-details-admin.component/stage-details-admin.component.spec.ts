import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageDetailsAdminComponent } from './stage-details-admin.component';

describe('StageDetailsAdminComponent', () => {
  let component: StageDetailsAdminComponent;
  let fixture: ComponentFixture<StageDetailsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageDetailsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageDetailsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
