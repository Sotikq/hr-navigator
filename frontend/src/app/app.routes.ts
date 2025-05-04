import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { CoursesComponent } from './courses/courses.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { StudentProfileComponent } from './student-profile/student-profile.component';
import { TeacherProfileComponent } from './teacher-profile/teacher-profile.component';
import { CoursePageComponent } from './course-page/course-page.component';
import { CreateCourse1Component } from './create-course1/create-course1.component';
import { CourseCompeletionStudentComponent } from './course-compeletion-student/course-compeletion-student.component';
import { AboutUsComponent } from './about-us/about-us.component';

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
  }, 
  {
    path: 'teacher',
    component: TeacherProfileComponent,
  },
  {
    path: 'course/:id',
    component: CoursePageComponent,
  },
  {
    path: 'edit/:id',
    component: CreateCourse1Component,
  },
  {
    path: 'course/play/:id',
    component: CourseCompeletionStudentComponent,
  },
  {
    path: 'aboutus',
    component: AboutUsComponent,
  },
];
