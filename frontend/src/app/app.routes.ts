import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { CoursesComponent } from './features/courses/components/courses/courses.component';
import { HomeComponent } from './features/pages/components/home/home.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { StudentProfileComponent } from './features/student/components/student-profile/student-profile.component';
import { AdminProfileComponent } from './features/admin/components/admin-profile/admin-profile.component';
import { CoursePageComponent } from './features/courses/components/course-page/course-page.component';
import { CreateCourse1Component } from './features/courses/components/create-course1/create-course1.component';
import { CourseCompeletionStudentComponent } from './features/courses/components/course-compeletion-student/course-compeletion-student.component';
import { AboutUsComponent } from './features/pages/components/about-us/about-us.component';
import { TeacherProfileComponent } from './features/teacher/components/teacher-profile/teacher-profile.component';
import { TermsOfServiceComponent } from './features/pages/components/terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './features/pages/components/privacy-policy/privacy-policy.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { CertificatesComponent } from './features/pages/components/certificates/certificates.component';

export const routes: Routes = [
  {
    path: 'courses',
    component: CoursesComponent,
  },
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'student',
    component: StudentProfileComponent,
    canActivate: [authGuard, roleGuard(['user'])],
  }, 
  {
    path: 'admin',
    component: AdminProfileComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'teacher',
    component: TeacherProfileComponent,
    canActivate: [authGuard, roleGuard(['teacher'])],
  },
  {
    path: 'course/:id',
    component: CoursePageComponent,
  },
  {
    path: 'edit/:id',
    component: CreateCourse1Component,
    canActivate: [authGuard, roleGuard(['teacher', 'admin'])],
  },
  {
    path: 'course/play/:id',
    component: CourseCompeletionStudentComponent,
    canActivate: [authGuard, roleGuard(['user'])],
  },
  {
    path: 'aboutus',
    component: AboutUsComponent,
  },
  // {
  //   path: 'terms-of-service',
  //   component: TermsOfServiceComponent,
  // },
  // {
  //   path: 'privacy-policy',
  //   component: PrivacyPolicyComponent,
  // },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'certificates',
    component: CertificatesComponent,
  },
  {
    path: 'certificate',
    component: CertificatesComponent,
  },
];
