import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProjectModal } from './new-project-modal';

describe('NewProjectModal', () => {
  let component: NewProjectModal;
  let fixture: ComponentFixture<NewProjectModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewProjectModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewProjectModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
