import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, Router } from '@angular/router';
import { COURSES , Course} from '../courses';

import { CourseService1 } from '../course1.service';
@Component({
  selector: 'app-courses',
  imports: [CommonModule,FormsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {


  courses: Course[] = []; // Массив курсов

  constructor(private router: Router, private crs: CourseService1) {
    crs.getCourses().subscribe((data) => {
      this.courses = data; // Получаем курсы из сервиса и сохраняем в массив
      console.log(this.courses); // Логируем курсы в консоль
    });
  }
  selectedCourse: any = null; // Переменная для хранения выбранного курса
  showModal: boolean = false; // Переменная для управления видимостью модального окна


  goToCourse(courseId: any) {
    this.router.navigate(['/course', courseId]); // Переход на страницу курса
  }




  openModal(course: any) {
    this.selectedCourse = course; // Устанавливаем выбранный курс
    this.showModal = true; // Показываем модальное окно
    console.log(course); // Логируем выбранный курс в консоль
  }
  closeModal() {
    this.showModal = false; // Закрываем модальное окно
    this.selectedCourse = null; // Сбрасываем выбранный курс
  }

  selectedCategory: string = ''; // Переменная для хранения выбранной категории
  searchQuery: string = ''; // Переменная для хранения поискового запроса
  getFilteredCourses() {
    if (!this.searchQuery) {
      return this.courses; // Если нет поискового запроса, возвращаем все курсы
    }

    return this.courses.filter((course) =>
      course.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    ); // Фильтруем курсы по заголовку
  }
}
