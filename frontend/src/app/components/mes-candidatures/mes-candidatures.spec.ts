import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesCandidatures } from './mes-candidatures';

describe('MesCandidatures', () => {
  let component: MesCandidatures;
  let fixture: ComponentFixture<MesCandidatures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesCandidatures]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesCandidatures);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
