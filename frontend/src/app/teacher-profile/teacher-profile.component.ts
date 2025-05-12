import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { AnalyticsChartComponent } from '../analytics-chart/analytics-chart.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Course } from '../courses';
import { CourseService1 } from '../course1.service';
@Component({
  selector: 'app-teacher-profile',
  imports: [
    RouterModule,
    CommonModule,
    AnalyticsChartComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './teacher-profile.component.html',
  styleUrl: './teacher-profile.component.scss',
})
export class TeacherProfileComponent {
  tabs = ['Review', 'Courses', 'analytics', 'messages', 'Settings'];
  user: any = null;
  currentPage: string = 'Review';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  courses: Course[] = []; // Массив курсов
  constructor(
    private router: Router,
    private crs: CourseService1, // QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQEEEESTION
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    crs.getCourses().subscribe((data) => {
      this.courses = data; // Получаем курсы из сервиса и сохраняем в массив
      console.log(this.courses); // Логируем курсы в консоль
    });
  }

  ngOnInit(): void {
    this.userFill();
    console.log(this.user);
    this.profileForm = this.fb.group({
      email: [this.user.email],
      username: [this.user.name, Validators.required],
    });

    this.auth.user$.subscribe((user) => {
      this.passwordForm = this.fb.group({
        oldPassword: ['', Validators.required],
        newPassword: ['', Validators.required],
        confirmPassword: ['', Validators.required],
      });
    });
    this.profileForm.controls['email'].disable();
  }

  goToEditCourse(courseId: string) {
    this.router.navigate(['/edit', courseId]); // Переход на страницу редактирования курса
  }

  onSubmit(): void {
    const usernametoupdate = this.profileForm.get('username')?.value;
    if (this.profileForm.valid) {
      const updatedUser: string = this.profileForm.value;
      //console.log('Сохраняем изменения:', updatedUser);

      this.auth.updateName({ name: usernametoupdate }).subscribe({
        next: (response) => {
          console.log('Профиль обновлён:', response);
          this.user.name = usernametoupdate; // Обновляем имя пользователя в локальном состоянии
          localStorage.setItem('currentUser', JSON.stringify(this.user)); // Сохраняем обновлённые данные в локальном хранилище
          this.auth.setUser(this.user); // Обновляем пользователя в AuthService
        },
        error: (error) => {
          console.error('Ошибка при обновлении профиля:', error);
        },
      });
      // Здесь можно отправить PATCH/PUT на сервер

      // После успешного ответа обнови BehaviorSubject:
      this.auth.setUser(updatedUser);

      alert('Профиль обновлён!');
    }
  }
  onChangePassword(): void {
    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    this.auth
      .updatePassword({ oldPassword, newPassword, confirmPassword })
      .subscribe({
        next: (response) => {
          console.log('Пароль обновлён:', response);
          alert('Пароль обновлён!');
        },
        error: (error) => {
          console.error('Ошибка при обновлении пароля:', error);
          alert('Ошибка при обновлении пароля!');
        },
      });
  }
  

  goToCreateCourse() {
    this.router.navigate(['/edit/0']);
  }

  userFill() {
    const userFromStorage = localStorage.getItem('currentUser');
    this.user = userFromStorage ? JSON.parse(userFromStorage) : null;
  }

  currentPageSwitch(page: string) {
    this.currentPage = page;
    console.log(this.currentPage);
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    this.router.navigate(['/']);
    this.auth.setUser(null); // Обновляем пользователя в AuthService
  }
}
