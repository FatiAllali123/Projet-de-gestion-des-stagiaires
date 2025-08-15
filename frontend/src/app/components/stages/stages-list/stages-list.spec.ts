import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StagesListComponent } from './stages-list';

describe('RhAdminStagesList', () => {
  let component: StagesListComponent;
  let fixture: ComponentFixture<StagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StagesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StagesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
