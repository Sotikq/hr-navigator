import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CourseService } from '../../../../services/course.service';
import { Course } from '../../../../shared/models/courses';
import { CertificateService } from '../../../../services/certificate.service';
import { PaymentService } from '../../../../services/payment.service';
@Component({
  selector: 'app-student-profile',
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.scss',
})
export class StudentProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  tabs = ['Мои Курсы', 'Сертификаты', 'Настройки', 'Платежи'];
  certificates: any[] = [];
  currentPage: string = 'Мои Курсы'; // Default page is 'profile'
  user: any = null;
  courses: Course[] = [];
  payments: any[] = [];
  constructor(
    private router: Router,
    private auth: AuthService,
    private fb: FormBuilder,
    private crs: CourseService,
    private certificateService: CertificateService,
    private paymentService: PaymentService
  ) {}
  userFill() {
    const userFromStorage = localStorage.getItem('currentUser');
    this.user = userFromStorage ? JSON.parse(userFromStorage) : null;
  }
  goToCourse(id : Course["id"]){
    this.router.navigate([`course/play/${id}`]);
  }
  getPayments(){
    this.paymentService.getAllMyPayments().subscribe((response) => {
      this.payments = response as any[];
      console.log("payments",response);
    });
  }

  ngOnInit(): void {
    this.getPayments();
    this.userFill();
    this.getCertificates();
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
    this.getMyCourses();
  }
  
  
  getCertificates() {
    this.certificateService.getCertificates().subscribe((response: any) => {
      this.certificates = response.data as any[];
      console.log(this.certificates);
    });
  }
  getMyCourses(){
    this.crs.getMyCoursesForStudent().subscribe((response) => {
      this.courses = response as any[];
      console.log("my courses",response);
    }
  );
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

  currentPageSwitch(page: string) {
    this.currentPage = page;
    console.log(this.currentPage);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('currentUser');
    this.auth.setUser(null);
    this.router.navigate(['']);
  }

}
