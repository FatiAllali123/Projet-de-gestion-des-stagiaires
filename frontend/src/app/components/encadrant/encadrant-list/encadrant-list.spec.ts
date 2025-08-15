import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncadrantList } from './encadrant-list';

describe('EncadrantList', () => {
  let component: EncadrantList;
  let fixture: ComponentFixture<EncadrantList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncadrantList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncadrantList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
