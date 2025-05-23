import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
import { Course } from '../courses';
import { Lesson, Module } from '../models/course.models11';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-create-course1',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-course1.component.html',
  styleUrl: './create-course1.component.scss',
})
export class CreateCourse1Component implements OnInit {
  currentCourse: any;
  courseLoaded = false;
  isSaving = false;

  selectedCoverFile: File | null = null;

  constructor(
    private crs: CourseService1,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id !== '0' && id !== null) {
        this.crs.getCourseById(id).subscribe((course) => {
          this.currentCourse = course;
          this.courseLoaded = true;
        });
      } else {
        const formData = new FormData();
        formData.append('title', 'qweqwe');
        formData.append('description', '');
        formData.append('details', '');
        formData.append('duration', '');
        formData.append('category', '');

        this.createCourseFromStart(formData).then((answer) => {
          this.router.navigate([`/edit/${answer}`]);
        });
      }
    });
  }

  async createCourseFromStart(data: any) {
    const answer = await lastValueFrom(this.crs.createCourse(data));
    //console.log(answer.id)
    return answer.id;
  }
  // Метод для выбора файла
  onImageUpload(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.currentCourse.cover_url = input.files[0];
    }
  }

  async onSaveCourse(): Promise<void> {
    this.isSaving = true;
    try {
      if (!this.currentCourse) return;

      // Создаем FormData
      const formData = new FormData();

      // Добавляем текстовые данные
      formData.append('title', this.currentCourse.title.toString());
      formData.append('description', this.currentCourse.description.toString());
      formData.append('details', this.currentCourse.details.toString());
      formData.append('price', this.currentCourse.price.toString());
      formData.append('duration', this.currentCourse.duration.toString());
      formData.append('category', this.currentCourse.category.toString());
      formData.append(
        'is_published',
        this.currentCourse.is_published ? 'true' : 'false'
      );

      // Добавляем файл обложки, если он был выбран
      if (this.currentCourse.cover_url) {
        formData.append('cover', this.currentCourse.cover_url);
      }

      // Отправляем FormData на сервер
      const updatedCourse = await lastValueFrom(
        this.crs.updateCourseWithCover(formData, this.currentCourse.id)
      );

      
      this.selectedCoverFile = null;
      console.log('Course updated successfully', updatedCourse);
    } catch (error) {
      console.error('Error updating course', error);
    } finally {
      this.isSaving = false;
    }
  }

  async save() {
    console.log(this.currentCourse.modules);
    if (this.currentCourse.modules) {
      console.log('QWEQWWWWW');
      for (const module of this.currentCourse.modules) {
        if (module.lessons) {
          for (const lesson of module.lessons) {
            const answer = await lastValueFrom(
              this.crs.updateLesson(lesson, lesson.id)
            );
          }
        }
        const updatedModule: updatedModuleRequest = {
          id: module.id,
          title: module.title,
          description: module.description,
          // positon: module.position,
        };
        const answermodule = await lastValueFrom(
          this.crs.updateModule(updatedModule, module.id)
        );
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
      const anwserCourse = await lastValueFrom(
        this.crs.updateCourse(UpdatedCourseRequest, this.currentCourse.id)
      );

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

   onSubmit() {
    
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
  //  onLessonVideoUpload() {}
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
  onDeleteCourse(id: Course['id']) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить курс?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteCourse(id).subscribe({
          next: (next) => {
            console.log(next);
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }
  onDeleteModule(id: Module['id']) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить модуль?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteModule(id).subscribe({
          next: () => {
            this.currentCourse.modules = this.currentCourse.modules.filter(
              (module: Module) => module.id !== id
            );
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }
  onDeleteLesson(id: Lesson['id'], module: Module) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить урок?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteLesson(id).subscribe({
          next: () => {
            module.lessons = module.lessons.filter(
              (lesson: Lesson) => lesson.id !== id
            );
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }
}
