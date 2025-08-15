import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListStagesComponent } from './list-stages';

describe('ListStages', () => {
  let component: ListStagesComponent;
  let fixture: ComponentFixture<ListStagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListStagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
