import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from '../app/courses'; 
import { CourseRequest, LessonRequest, Module, ModuleRequest } from './models/course.models';
@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) { }
  getCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}courses`);
  }
  getCourseById(id: string) {
    return this.http.get<Course>(`${this.apiUrl}courses/${id}`);
  }

  getUnpublishedCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}courses/unpublished`);
  }

  createCourse(course: CourseRequest) {
    return this.http.post<Course>(`${this.apiUrl}courses`, course);
  }
  createModule(module: ModuleRequest, courseId: string) {
    return this.http.post<Module>(`${this.apiUrl}courses/${courseId}/modules`, module);
  }
  createLesson(lesson: LessonRequest, moduleId: string) {
    return this.http.post<Module>(`${this.apiUrl}courses/modules/${moduleId}/lessons`, lesson);
  }
}
