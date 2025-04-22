import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { CoursesComponent } from './courses/courses.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { StudentProfileComponent } from './student-profile/student-profile.component';
import { CourseCompletionComponent } from './course-completion/course-completion.component';

export const routes: Routes = [
   {
    path: 'courses',
    component: CoursesComponent
   },
   {
      path:'',
      component: HomeComponent
   },
   {
      path:'register',
      component: RegisterComponent
   },
   {
      path:'login',
      component: LoginComponent
   },
   {
      path:'student',
      component: StudentProfileComponent
   },
   {
      path:'course-completion',
      component: CourseCompletionComponent
   }
];
