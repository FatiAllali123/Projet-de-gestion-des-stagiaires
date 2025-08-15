import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportGestion } from './rapport-gestion';

describe('RapportGestion', () => {
  let component: RapportGestion;
  let fixture: ComponentFixture<RapportGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
