import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortLabComponent } from './sort-lab.component';

describe('SortLabComponent', () => {
  let component: SortLabComponent;
  let fixture: ComponentFixture<SortLabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortLabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
