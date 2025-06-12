import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { AnalyticsChartComponent } from '../../../../shared/components/analytics-chart/analytics-chart.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Course } from '../../../../shared/models/courses';
import { CourseService } from '../../../../services/course.service';
import { adminService } from '../../../../services/admin.service';
import { MatDialog } from '@angular/material/dialog';
import { AdminCoursesDialogComponent } from '../admin-courses-dialog/admin-courses-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Teacher } from '../../../../shared/models/teacher.models';
import { PaymentService } from '../../../../services/payment.service';
import { RegisterTeacherComponent } from '../register-teacher/register-teacher.component';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationComponent } from '../../../../shared/components/notification/notification.component';
import { InputDialogComponent, InputDialogData } from '../../../../shared/components/input-dialog/input-dialog.component';
@Component({
  selector: 'app-admin-profile',
  imports: [
    RouterModule,
    CommonModule,
    AnalyticsChartComponent,
    ReactiveFormsModule,
    NotificationComponent
  ],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent implements OnDestroy {
  tabs = ['Обзор', 'Курсы', 'Аналитика', 'Сообщения', 'Преподаватель','Платежи', 'Результаты тестов', 'Настройки'];
  user: any = null;
  currentPage: string = 'Обзор';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  allTeachers: any = [];
  courses: Course[] = []; // Массив курсов
  payments: any = [];
  paymentsLoaded: boolean = false;
  tests: any = [];
  testsLoaded: boolean = false;
  
  // Pagination for test results
  testsPagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  
  // Selected test for detailed view
  selectedTest: any = null;
  showTestDetailsModal: boolean = false;
  
  // Make Math available in template
  Math = Math;
  constructor(
    private router: Router,
    private crs: CourseService, // QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQEEEESTION
    private auth: AuthService,
    private fb: FormBuilder,
    private adminService: adminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getTests();
    this.getPayments();
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

  

  getPayments() {
    this.paymentService.getPayments().subscribe((data) => {
      console.log(data, 'payments');
      this.payments = data;
      this.paymentsLoaded = true;
      console.log(this.payments, 'payments');
    });
  }
  approvePayment(payment: any) {
    // Подтверждаем платеж
    this.paymentService.approvePayment(payment.id).subscribe({
      next: (response) => {
        console.log(response, 'payment approved');
        payment.status = 'confirmed';
        this.notificationService.showSuccess('Платеж подтвержден');
      },
      error: (error) => {
        console.error('Ошибка при подтверждении платежа:', error);
        let errorMessage = 'Ошибка при подтверждении платежа';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.notificationService.showError(errorMessage);
      }
    });
  }
  invoicePayment(payment: any) {
    // Открываем диалог для ввода URL инвойса
    const dialogData: InputDialogData = {
      title: 'Выставить счет',
      message: 'Введите URL инвойса для платежа:',
      placeholder: 'https://example.com/invoice.pdf',
      required: true,
      inputType: 'url'
    };

    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(invoiceUrl => {
      if (invoiceUrl) {
        this.paymentService.invoicePayment(payment.id, invoiceUrl).subscribe({
          next: (response) => {
            console.log(response, 'payment invoiced');
            payment.status = 'invoiced';
            this.notificationService.showSuccess('Платеж выставлен');
          },
          error: (error) => {
            console.error('Ошибка при выставлении инвойса:', error);
            let errorMessage = 'Ошибка при выставлении инвойса';
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            this.notificationService.showError(errorMessage);
          }
        });
      }
    });
  }
  rejectPayment(payment: any) {
    // Открываем диалог для ввода причины отклонения
    const dialogData: InputDialogData = {
      title: 'Отклонить платеж',
      message: 'Введите причину отклонения (необязательно):',
      placeholder: 'Укажите причину отклонения...',
      required: false,
      inputType: 'textarea'
    };

    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(reason => {
      // Даже если reason null или пустая строка, выполняем отклонение
      if (reason !== null) { // null означает что пользователь нажал "Отмена"
        this.paymentService.rejectPayment(payment.id, reason || undefined).subscribe({
          next: (response) => {
            payment.status = 'rejected';
            this.notificationService.showSuccess('Платеж отклонен');
          },
          error: (error) => {
            console.error('Ошибка при отклонении платежа:', error);
            let errorMessage = 'Ошибка при отклонении платежа';
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            this.notificationService.showError(errorMessage);
          }
        });
      }
    });
  }

  getTests(page: number = 1, limit: number = 10) {
    this.testsLoaded = false;
    this.adminService.getTests(page, limit).subscribe((response: any) => {
      this.tests = response.data || response; // Handle both wrapped and direct response
      this.testsPagination = response.pagination || {
        page: page,
        limit: limit,
        total: this.tests.length,
        pages: Math.ceil(this.tests.length / limit)
      };
      this.testsLoaded = true;
      console.log('Tests loaded:', this.tests);
    });
  }

  // Navigate to specific page
  goToTestPage(page: number) {
    if (page >= 1 && page <= this.testsPagination.pages) {
      this.testsPagination.page = page;
      this.getTests(page, this.testsPagination.limit);
    }
  }

  // Previous page
  previousTestPage() {
    if (this.testsPagination.page > 1) {
      this.goToTestPage(this.testsPagination.page - 1);
    }
  }

  // Next page
  nextTestPage() {
    if (this.testsPagination.page < this.testsPagination.pages) {
      this.goToTestPage(this.testsPagination.page + 1);
    }
  }

  // Show test details in modal
  showTestDetails(test: any) {
    this.selectedTest = test;
    this.showTestDetailsModal = true;
    // Add class to body to prevent scrolling
    document.body.classList.add('modal-open');
  }

  // Close test details modal
  closeTestDetailsModal() {
    this.showTestDetailsModal = false;
    this.selectedTest = null;
    // Remove class from body to restore scrolling
    document.body.classList.remove('modal-open');
  }

  // Format score display
  formatScore(test: any): string {
    if (test.score !== undefined && test.max_score !== undefined) {
      return `${test.score}/${test.max_score} (${Math.round((test.score / test.max_score) * 100)}%)`;
    }
    return 'Не оценено';
  }

  // Get score color based on percentage
  getScoreColor(test: any): string {
    if (test.score === undefined || test.max_score === undefined) {
      return '#gray';
    }
    const percentage = (test.score / test.max_score) * 100;
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  goToEditCourse(courseId: string) {
    this.router.navigate(['/edit', courseId]); // Переход на страницу редактирования курса
  }
  createTeacher() {
    this.dialog.open(RegisterTeacherComponent, {
      width: '500px',
    });
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

  ngOnDestroy() {
    // Clean up modal-open class if component is destroyed while modal is open
    document.body.classList.remove('modal-open');
  }
}
