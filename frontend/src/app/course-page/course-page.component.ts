import { Component } from '@angular/core';
import { COURSES, Course } from '../courses';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService } from '../course.service';

@Component({
  selector: 'app-course-page',
  imports: [CommonModule],
  templateUrl: './course-page.component.html',
  styleUrl: './course-page.component.scss',
})
export class CoursePageComponent {
  course: Course | undefined; // Определяем тип course как Course или undefined

  constructor(private route: ActivatedRoute, private crs: CourseService) {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id, typeof id); // Логируем id в консоль
     if (id) {
    crs.getCourseById(id).subscribe((data) => {
      this.course = data; // Получаем курс из сервиса и сохраняем в переменную course
      console.log(this.course); // Логируем курс в консоль
    });
  } else {
    console.error('Invalid course ID: null');
  }

    //   this.course = COURSES.find(c => c.id === Number(id));
  }
}
