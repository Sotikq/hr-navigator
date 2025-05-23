import { Component, OnInit } from '@angular/core';
import { COURSES, Course } from '../courses';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService1 } from '../course1.service';
import { PaymentService } from '../payment.service';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-course-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './course-page.component.html',
  styleUrl: './course-page.component.scss',
})
export class CoursePageComponent implements OnInit {
  course: Course | undefined; // Определяем тип course как Course или undefined
  id: string | null;
  isCourseBought: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private crs: CourseService1,
    private paymentService: PaymentService,
    private router: Router
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(this.id, typeof this.id); // Логируем id в консоль

    //   this.course = COURSES.find(c => c.id === Number(id));
  }
  ngOnInit() {
    if (this.id) {
      this.crs.getCourseById(this.id).subscribe((data) => {
        this.course = data; // Получаем курс из сервиса и сохраняем в переменную course
        console.log(this.course); // Логируем курс в консоль

        this.crs.getCourseById(this.id!).subscribe((data) => {
          //          this.isCourseBought = data.is_bought;
        });
      });
    } else {
      console.error('Invalid course ID: null');
    }
  }
  buyCourse() {
    this.paymentService.buyCourse(this.id!).subscribe((data) => {
      console.log(data);
      this.isCourseBought = true;
    });
  }
}
