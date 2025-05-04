import { Component } from '@angular/core';
import {
  Course,
  Module,
  LessonRequest,
  CourseRequest,
  ModuleRequest,
} from '../models/course.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CourseService } from '../course.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-creating-course',
  imports: [FormsModule, CommonModule],
  templateUrl: './creating-course.component.html',
  styleUrl: './creating-course.component.scss',
})
export class CreatingCourseComponent {
  currentCourse: CourseRequest;

  modules: ModuleRequest[] = [];
  constructor(private crs: CourseService, private router: Router) {
    this.currentCourse = this.createEmptyCourse();
  }

  createEmptyCourse(): CourseRequest {
    return {
      title: '',
      description: '',
      details: 'string',
      price: 123,
      duration: 'string',
      cover_url: null,
      category: 'HR',
      is_published: true,
    };
  }

  addModule(): void {
    this.modules.push({
      CourseId: 'string',
      title: '',
      description: '',
      position: this.modules.length + 1,
      lessons: [],
    });
  }
  addLesson(module: Module): void {
    module.lessons.push({
      ModuleId: '',
      title: '',
      description: '',
      type: '',
      content_url: '',
      position: (module.lessons.length + 1) || 0,
    });
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      //this.currentCourse.imageFile = input.files[0];
      //this.currentCourse.imageUrl = URL.createObjectURL(input.files[0]);
    }
  }

  onLessonVideoUpload(lesson: LessonRequest, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      lesson.content_url = URL.createObjectURL(input.files[0]);
    }
  }

  onSubmit(): void {
    var CourseId = '';
    var responseOfCourse = false;
    console.log(this.currentCourse);
    this.crs.createCourse(this.currentCourse).subscribe({
      next: (data) => {
        console.log('Курс успешно создан:', data); // Логируем ответ сервера
        CourseId = data.id; // Сохраняем ID курса

        for (const module of this.modules) {
          module.CourseId = CourseId; // Устанавливаем ID курса для каждого модуля
          this.crs.createModule(module, module.CourseId).subscribe({
            next: (data) => {
              console.log('Модуль успешно создан:', data); // Логируем ответ сервера
              var ModuleId = data.id; // Сохраняем ID модуля
              if (module.lessons && module.lessons.length > 0) {
                for (const lesson of module.lessons) {
                  lesson.ModuleId = ModuleId || ''; // Устанавливаем ID модуля для каждого урока
                  this.crs.createLesson(lesson, lesson.ModuleId).subscribe({
                    next: (data) => {
                      console.log('Урок успешно создан:', data); // Логируем ответ сервера
                    },
                    error: (error) => {
                      console.error('Ошибка при создании урока:', error); // Логируем ошибку
                      alert('Ошибка при создании урока: ' + error.error.error); // Показываем пользователю сообщение об
                      responseOfCourse = true; // Устанавливаем флаг ошибки
                    },
                  });
                }
              }
            },
            error: (error) => {
              console.error('Ошибка при создании модуля:', error); // Логируем ошибку
              alert('Ошибка при создании модуля: ' + error.error.error); // Показываем пользователю сообщение об
              responseOfCourse = true;
            },
          });
        }
      },
      error: (error) => {
        console.error('Ошибка при создании курса:', error); // Логируем ошибку
        alert('Ошибка при создании курса: ' + error.error.error); // Показываем пользователю сообщение об
        responseOfCourse = true;
      },
    });
    if (!responseOfCourse) {
      alert('Курс успешно создан!'); // Показываем пользователю сообщение об успешном создании курса
      this.router.navigate(['/teacher']); // Перенаправляем пользователя на главную страницу или другую страницу
    } else {
      alert('Ошибка при создании курса!'); // Показываем пользователю сообщение об ошибке
    }
    // Здесь вы можете отправить данные на сервер или выполнить другие действия
  }
  save(): void {}

  goBack(): void {
    window.history.back();
  }
}
