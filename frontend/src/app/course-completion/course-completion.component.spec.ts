import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCompletionComponent } from './course-completion.component';

describe('CourseCompletionComponent', () => {
  let component: CourseCompletionComponent;
  let fixture: ComponentFixture<CourseCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCompletionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
