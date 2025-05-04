// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Course } from '../app/courses'; 
// import { CourseRequest, CourseResponse, CourseUpdateRequest, LessonRequest, LessonResponse, LessonUpdateRequest, Module, ModuleRequest, ModuleResponse, ModuleUpdateRequest } from './models/course.models';
// @Injectable({
//   providedIn: 'root'
// })

// export class CourseService {
//   private apiUrl = 'http://localhost:5000/api/';
//   constructor(private http: HttpClient) { }
//   getCourses() {
//     return this.http.get<Course[]>(`${this.apiUrl}courses`);
//   }
//   getCourseById(id: string) {
//     return this.http.get<Course>(`${this.apiUrl}courses/${id}`);
//   }
//   getCourseByIdWithModules(id: string) {
//     return this.http.get<CourseResponse>(`${this.apiUrl}courses/${id}`);
//   }
//   getUnpublishedCourses() {
//     return this.http.get<Course[]>(`${this.apiUrl}courses/unpublished`);
//   }

//   createCourse(course: CourseRequest) {
//     return this.http.post<Course>(`${this.apiUrl}courses`, course);
//   }
//   createModule(module: ModuleRequest, courseId: string) {
//     return this.http.post<Module>(`${this.apiUrl}courses/${courseId}/modules`, module);
//   }
//   createLesson(lesson: LessonRequest, moduleId: string) {
//     return this.http.post<LessonRequest>(`${this.apiUrl}courses/modules/${moduleId}/lessons`, lesson);
//   }
//   updateCourse(course : CourseUpdateRequest, courseId: string) {
//     return this.http.patch<CourseResponse>(`${this.apiUrl}courses/${courseId}`, course);
//   }
//   updateModule(module: ModuleUpdateRequest, moduleId: string) {
//     return this.http.patch<ModuleResponse>(`${this.apiUrl}courses/modules/${moduleId}`, module);
//   }
//   updateLesson(lesson: LessonUpdateRequest, lessonId: string) {
//     return this.http.patch<LessonRequest>(`${this.apiUrl}courses/lessons/${lessonId}`, lesson);
//   }

// }
