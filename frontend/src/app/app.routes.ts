import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { CoursesComponent } from './courses/courses.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { StudentProfileComponent } from './student-profile/student-profile.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { CoursePageComponent } from './course-page/course-page.component';
import { CreateCourse1Component } from './create-course1/create-course1.component';
import { CourseCompeletionStudentComponent } from './course-compeletion-student/course-compeletion-student.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { TeacherProfileComponent } from './teacher-profile/teacher-profile.component';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { adminGuard } from './guards/admin.guard';

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
  {
    path: 'terms-of-service',
    component: TermsOfServiceComponent,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
  }
];
