import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../course.service';
import {
  CourseResponse,
  LessonResponse,
  ModuleResponse,
  CourseUpdateRequest,
  Module,
} from '../models/course.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editing-course',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './editing-course.component.html',
  styleUrl: './editing-course.component.scss',
})
export class EditingCourseComponent {
  course!: CourseResponse; // Initialize course to null
  isLoaded: boolean = false;
  currentCourse: any;

  constructor(private route: ActivatedRoute, private crs: CourseService) {
    this.loadCourse();
    // const Arr : Array<Module> = [];
    // console.log(Arr.lessons.length);
  }

  addModule() {
    console.log('Module:', this.course?.modules);
    const idForModule = '';
    this.onSubmit();
    if (this.course && this.course.modules) {
      console.log('Course ID:', this.course.id);
      this.crs
        .createModule(
          {
            CourseId: this.course.id,
            title: '',
            description: '',
            position: this.course.modules.length + 1,
            lessons: [], // Initialize lessons as an empty array
          },
          this.course.id
        )
        .subscribe({
          next: (module) => {
            console.log('Module createdeeeeeeeeeeeee:', module);
            module.lessons = []; // Initialize lessons as an empty array
            this.course?.modules?.push(module); // Add the new module to the course's modules array
            //this.loadCourse();
          },
          error: (error) => {
            console.error('Error creating module:', error);
          },
        });
    }
  }
  addLesson(module: Module) {
    console.log('Module:', module);
    const idForLesson = '';
    if (module.id) {
      console.log('Module ID:', module.id);
      this.crs
        .createLesson(
          {
            ModuleId: module.id,
            title: '',
            description: '',
            type: '',
            content_url: '',
            position: module?.lessons?.length + 1 || 0, // Set position based on the number of lessons in the module
          },
          module.id
        )
        .subscribe({
          next: (lesson) => {
            console.log(
              'Lesson createdwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww:',
              lesson
            );
            module.lessons.push(lesson); // Add the new lesson to the module's lessons array
          },
          error: (error) => {
            console.error('Error creating lesson:', error);
          },
        });
    }
  }
  onImageUpload($event: Event) {
    throw new Error('Method not implemented.');
  }

  save() {}

  onLessonVideoUpload(_t77: any, $event: Event) {
    throw new Error('Method not implemented.');
  }

  loadCourse() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.crs.getCourseByIdWithModules(courseId).subscribe({
        next: (course) => {
          this.course = course;
          // this.course.modules = course.modules || []; // Initialize modules with the fetched data
          // this.lessons = course.modules.flatMap((module) => module.lessons) || []; // Initialize lessons with the fetched data
          console.log('COURRR', course);
          //console.log('MODDDDD', this.modules);
          //  console.log(this.lessons);
          this.isLoaded = true; // Set isLoaded to true after fetching the course
        },
        error: (error) => {
          console.error('Error fetching course:', error);
        },
      });
    }
  }

  goBack() {
    throw new Error('Method not implemented.');
  }
  onSubmit(): void {
    // Implement the logic to save the course details here
    const courseUpdate: CourseUpdateRequest = {
      title: this.course.title,
      description: this.course.description,
      details: this.course.details,
      price: this.course.price,
      duration: this.course.duration,
      cover_url: null,
      category: this.course.category,
      is_published: this.course.is_published,
    };
    this.crs.updateCourse(courseUpdate, this.course.id).subscribe({
      next: (response) => {
        console.log('Course updated:', response);
        alert('Course updated!');
      },
      error: (error) => {
        console.error('Error updating course:', error);
        alert('Error updating course!');
      },
    });
    console.log('Course saved:', this.course);
    if (this.course.modules) {
      console.log('Modules:', this.course.modules);
      for (const module of this.course.modules) {
        console.log('Module:', module);
        if (module.id) {
          this.crs
            .updateModule(
              {
                title: module.title,
                description: module.description,
                position: 0, // Include lessons in the update request
              },
              module.id
            )
            .subscribe({
              next: (response) => {
                console.log('Module updated:', response);
              },
              error: (error) => {
                console.error('Error updating module:', error);
              },
            });
        }
        // Check if the module has lessons and log them
        if (module.lessons) {
          console.log('Lessons:', module.lessons);
          // Iterate through lessons in the module

          for (const lesson of module.lessons) {
            if (lesson.id) {
              console.log('Lesson ID:', lesson.id);
              this.crs
                .updateLesson(
                  {
                    title: lesson.title,
                    description: lesson.description,
                    type: lesson.type,
                    content_url: lesson.content_url,
                    position: lesson.position,
                  },
                  lesson.id
                )
                .subscribe({
                  next: (response) => {
                    console.log('Lesson updated:', response);
                  },
                  error: (error) => {
                    console.error('Error updating lesson:', error);
                  },
                });
            }
            console.log('Lesson:', lesson);
          }
        }
      }
    }
  }
}
