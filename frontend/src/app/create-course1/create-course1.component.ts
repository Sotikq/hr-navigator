import { Component } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  addModuletoCourseRequest,
  createCourseRequest,
  UpdatedCourseRequest,
  lessonModel,
  updatedModuleRequest,
  LessonRequest,
} from '../models/course.models11';
import { CourseService1 } from '../course1.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-course1',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-course1.component.html',
  styleUrl: './create-course1.component.scss',
})
export class CreateCourse1Component {
  currentCourse: any;
  courseLoaded = false;

  selectedCoverFile: File | null = null;

  // Метод для выбора файла
  onImageUpload(event: any): void {
    this.selectedCoverFile = event.target.files[0];

    // Превью изображения
    if (this.selectedCoverFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentCourse.cover_url = e.target.result;
      };
      reader.readAsDataURL(this.selectedCoverFile);
    }
  }


  onSaveCourse1(): void {
    if (!this.currentCourse) return;
  
    // Создаем FormData
    const formData = new FormData();
    
    // Добавляем текстовые данные
    formData.append('title', this.currentCourse.title.toString());
    formData.append('description', this.currentCourse.description.toString());
    formData.append('details', this.currentCourse.details.toString());
    formData.append('price', this.currentCourse.price);
    formData.append('duration', this.currentCourse.duration.toString());
    formData.append('category', this.currentCourse.category.toString());
    formData.append('is_published', this.currentCourse.is_published ? 'true' : 'false');
    
    // Добавляем файл обложки, если он был выбран
    if (this.selectedCoverFile) {
      formData.append('cover', this.selectedCoverFile, this.selectedCoverFile.name);
    }
  
    // Отправляем FormData на сервер
    this.crs.updateCourseWithCover(formData, this.currentCourse.id).subscribe({
      next: (course) => {
        console.log('Course updated successfully', course);
        this.currentCourse = course;
        this.selectedCoverFile = null;
      },
      error: (error) => {
        console.error('Error updating course', error);
      }
    });
  }




  constructor(
    private crs: CourseService1,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const id = route.snapshot.paramMap.get('id');
    if (id !== '0' && id !== null) {
      console.log('ID:', id);
      this.crs.getCourseById(id).subscribe((course) => {
        this.currentCourse = course;
        console.log('Course fetched:', course);
        this.courseLoaded = true;
      });
    } else {
      const createdCourse: createCourseRequest = {
        title: '',
        description: '',
        details: '',
        price: 0,
        duration: '',
        cover_url: null,
        category: '',
        is_published: true,
      };
      console.log('Creating new course...');
      crs.createCourse(createdCourse).subscribe((course) => {
        this.currentCourse = course;
        console.log('Course created:', course);
        this.router.navigate(['/edit', course.id]);
      });
      this.currentCourse = null; // Handle the case where no ID is provided
    }
  } // Inject the CourseService

  onSaveCourse() {
    console.log('Saving course:', this.currentCourse);
    const updatedCourse: UpdatedCourseRequest = {
      title: this.currentCourse.title,
      description: this.currentCourse.description,
      details: this.currentCourse.details,
      price: this.currentCourse.price,
      duration: this.currentCourse.duration,
      cover_url: this.currentCourse.cover_url,
      category: this.currentCourse.category,
      is_published: this.currentCourse.is_published,
      id: this.currentCourse.id,
    };
    this.crs.updateCourse(updatedCourse, this.currentCourse.id).subscribe({
      next: (course) => {
        this.currentCourse = course;
        console.log('Course updated:', course);
      },
      error: (error) => {
        console.error('Error updating course:', error);
      },
    });
  }

  save() {}
  async onSubmit() {
    console.log(this.currentCourse.modules);
    if (this.currentCourse.modules) {
      console.log('QWEQWWWWW');
      for (const module of this.currentCourse.modules) {
        if (module.lessons) {
          for (const lesson of module.lessons) {

           const answer = await lastValueFrom(this.crs.updateLesson(lesson, lesson.id) );
          
          }
        }
        const updatedModule: updatedModuleRequest = {
          id: module.id,
          title: module.title,
          description: module.description,
          // positon: module.position,
        };
        const answermodule = await  lastValueFrom(this.crs.updateModule(updatedModule, module.id) )
      }
    }
    if (this.currentCourse) {
      const UpdatedCourseRequest: UpdatedCourseRequest = {
        id: this.currentCourse.id,
        title: this.currentCourse.title,
        description: this.currentCourse.description,
        details: this.currentCourse.details,
        price: this.currentCourse.price,
        duration: this.currentCourse.duration,
        cover_url: this.currentCourse.cover_url,
        category: this.currentCourse.category,
        is_published: this.currentCourse.is_published,
      };
      const anwserCourse = await lastValueFrom(this.crs.updateCourse(UpdatedCourseRequest, this.currentCourse.id));
  
      this.currentCourse = this.crs
        .getCourseById(this.currentCourse.id)
        .subscribe({
          next: (course) => {
            this.currentCourse = course;
            console.log('COURSE FROM SUBMITT', this.currentCourse);
          },
          error: (error) => {
            console.error(error);
          },
        });
    }
  }
  addModule() {
    const createdModule: addModuletoCourseRequest = {
      title: '',
      description: '',
      positon: 0,
    };
    console.log(createdModule);
    this.crs.addModuletoCourse(createdModule, this.currentCourse.id).subscribe({
      next: (module) => {
        console.log(module);
        this.currentCourse.modules.push({
          ...module,
          lessons: [] as lessonModel[],
        });
        console.log(this.currentCourse.modules);
      },
      error: (error) => {
        console.error('error adding module', error);
      },
    });
  }
  onLessonVideoUpload() {}
  addLesson(module: any) {
    const createdLesson: LessonRequest = {
      moduleId: module.id,
      title: '',
      type: 'video',
      content_url: '',
      description: '',
      position: 0,
      // created_at: "",
    };
    console.log(module);
    this.crs.createLesson(createdLesson, module.id).subscribe({
      next: (next) => {
        module.lessons.push(next);
        console.log(next);
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
}
