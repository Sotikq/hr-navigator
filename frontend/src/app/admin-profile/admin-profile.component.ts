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
import { adminService } from '../admin.service';
import { MatDialog } from '@angular/material/dialog';
import { AdminCoursesDialogComponent } from '../admin-courses-dialog/admin-courses-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Teacher } from '../models/teacher.models';
@Component({
  selector: 'app-admin-profile',
  imports: [
    RouterModule,
    CommonModule,
    AnalyticsChartComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent {
  tabs = ['Review', 'Courses', 'analytics', 'messages', 'teachers', 'Settings'];
  user: any = null;
  currentPage: string = 'Review';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  allTeachers: any = [];
  courses: Course[] = []; // Массив курсов

  constructor(
    private router: Router,
    private crs: CourseService1, // QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQEEEESTION
    private auth: AuthService,
    private fb: FormBuilder,
    private adminService: adminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.crs.getCourses().subscribe((data) => {
      this.courses = data; // Получаем курсы из сервиса и сохраняем в массив
      console.log(this.courses); // Логируем курсы в консоль
    });
    this.userFill();
    this.getTeachers();
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
  getTeachers() {
    this.adminService.getTeachersWithCourses().subscribe({
      next: (data) => {
        this.allTeachers = data;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  openTeacherCoursesDialog(teacher: any): void {
    console.log(teacher.courses);
    const dialogRef = this.dialog.open(AdminCoursesDialogComponent, {
      width: '500px',
      data: {
        teacher: teacher,
        allCourses: this.courses, // Ваш метод для получения всех курсов
        teachesCourses: teacher.courses,
      },
    });

    dialogRef.afterClosed().subscribe((selectedCourse: Course) => {
      if (selectedCourse) {
        this.addCourseToTeacher(teacher.id, selectedCourse);
      }
      console.log(
        'qweqeqwe',
        teacher.id,
        typeof teacher.id,
        'asdasdas',
        selectedCourse
      );
    });
  }

  addCourseToTeacher(teacherId: string, selectedCourse: any) {
    this.adminService.addCourseToTeacher(teacherId, selectedCourse).subscribe({
      next: (data) => {
        console.log(data, 'added');
        const teacher = this.allTeachers.find(
          (t: { id: string }) => t.id === teacherId
        );
        if (teacher) {
          teacher.courses = data;
        }
        this.snackBar.open('Курс успешно добавлен', 'Закрыть', {
          duration: 3000,
        });
        
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  removeCourseFromTeacher(teacher : Teacher , courseId: Course["id"]){
     
  
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: {
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить курс у преподавателя ${teacher.name}?`
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.adminService.removeCourseFromTeacher(teacher.id, courseId).subscribe({
        next: (response) => {
          // Удаляем курс локально без перезагрузки
          teacher.Courses = teacher.Courses?.filter((c: any) => c.id !== courseId) || [];
          this.snackBar.open('Курс удален', 'Закрыть', { duration: 3000 });
          console.log(response);
        },
        error: (err) => {
          this.snackBar.open('Ошибка при удалении', 'Закрыть', { duration: 3000 });
          console.error(err);
        }
      });
    }
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
