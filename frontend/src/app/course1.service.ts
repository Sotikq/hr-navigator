import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from '../app/courses';
import {
  addModuletoCourseRequest,
  LessonRequest,
  UpdatedCourseRequest,
  updatedModuleRequest,
  updateLesson,
} from './models/course.models11';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class CourseService1 {
  private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) {}

  getCourseById(id: string) {
    return this.http.get<Course>(`${this.apiUrl}courses/${id}`);
  }

  createCourse(course: any) {
    return this.http.post<Course>(`${this.apiUrl}courses`, course);
  }

  updateCourse(course: UpdatedCourseRequest, courseId: string) {
    return this.http.patch<any>(`${this.apiUrl}courses/${courseId}`, course);
  }

  addModuletoCourse(module: addModuletoCourseRequest, courseId: string) {
    return this.http.post<any>(
      `${this.apiUrl}courses/${courseId}/modules`,
      module
    );
  }

  updateLesson(lesson: updateLesson, lessonId: string):Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}courses/lessons/${lessonId}`,
      lesson
    );
  }
  updateModule(module: updatedModuleRequest, moduleId: string) {
    return this.http.patch<any>(`${this.apiUrl}courses/modules/${moduleId}`, module);
  }
  createLesson(lesson: LessonRequest, moduleId: string) {
    return this.http.post<any>(`${this.apiUrl}courses/modules/${moduleId}/lessons`, lesson);
  }


  updateCourseWithCover(formData: FormData, courseId: string) {
    return this.http.patch<any>(`${this.apiUrl}courses/${courseId}`, formData);
  }
  
  
  
  getCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}courses`);
  }
  // getCourseByIdWithModules(id: string) {
  //   return this.http.get<CourseResponse>(`${this.apiUrl}courses/${id}`);
  // }
  // getUnpublishedCourses() {
  //   return this.http.get<Course[]>(`${this.apiUrl}courses/unpublished`);
  // }
}
