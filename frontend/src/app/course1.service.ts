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
import { Lesson, Module } from './models/course.models11';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class CourseService1 {
  private apiUrl = environment.apiUrl + '/';
  constructor(private http: HttpClient) {}

  getCourseById(id: string) {
    return this.http.get<Course>(`${this.apiUrl}courses/${id}`);
  }

  createCourse(course: any) {
    return this.http.post<Course>(`${this.apiUrl}courses`, course);
  }
  deleteCourse(id:Course["id"]){
    return this.http.delete(`${this.apiUrl}courses/${id}`);
  }
  deleteModule(id:Module["id"]){
    return this.http.delete(`${this.apiUrl}courses/modules/${id}`)
  }
  deleteLesson(id:Lesson["id"]){
    return this.http.delete(`${this.apiUrl}courses/lessons/${id}`)
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



  getCourseProgress(courseId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}progress/course/${courseId}`);
}

completeLesson(lessonId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}progress/lesson/${lessonId}`, {lessonId});
}
getMyCoursesForStudent(){
  return this.http.get(`${this.apiUrl}auth/me/courses`);
}
  // getCourseByIdWithModules(id: string) {
  //   return this.http.get<CourseResponse>(`${this.apiUrl}courses/${id}`);
  // }
  // getUnpublishedCourses() {
  //   return this.http.get<Course[]>(`${this.apiUrl}courses/unpublished`);
  // }
}
