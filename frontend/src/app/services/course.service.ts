import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from '../shared/models/courses';
import {
  addModuletoCourseRequest,
  LessonRequest,
  TopicRequest,
  UpdatedCourseRequest,
  updatedModuleRequest,
  updateLesson,
  CourseDetails,
  CreateCourseDetailsRequest,
  UpdateCourseDetailsRequest,
} from '../shared/models/course.models11';
import { Observable } from 'rxjs';
import { Lesson, Module } from '../shared/models/course.models11';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getCourseById(id: string) {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`);
  }

  createCourse(course: any) {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course);
  }
  deleteCourse(id:Course["id"]){
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }
  deleteModule(id:Module["id"]){
    return this.http.delete(`${this.apiUrl}/courses/modules/${id}`)
  }
  deleteLesson(id:Lesson["id"]){
    return this.http.delete(`${this.apiUrl}/courses/lessons/${id}`)
  }  
  
  updateCourse(course: any, courseId: string) {
    return this.http.patch<any>(`${this.apiUrl}/courses/${courseId}`, course);
  }

  addModuletoCourse(module: addModuletoCourseRequest, courseId: string) {
    return this.http.post<any>(
      `${this.apiUrl}/courses/${courseId}/modules`,
      module
    );
  }

  addTopicToModule(topic: TopicRequest, moduleId: string) {
    return this.http.post<any>(`${this.apiUrl}/courses/modules/${moduleId}/topics`, topic);
  }
  deleteTopic(topicId: string) {
    return this.http.delete(`${this.apiUrl}/courses/topics/${topicId}`);
  }
  updateLesson(lesson: updateLesson, lessonId: string) {
    return this.http.patch<any>(
      `${this.apiUrl}/courses/lessons/${lessonId}`,
      lesson
    );
  }
  updateTopic(topic: TopicRequest, topicId: string) {
    return this.http.patch<any>(
      `${this.apiUrl}/courses/topics/${topicId}`,
      topic
    );
  }
  updateModule(module: updatedModuleRequest, moduleId: string) {
    return this.http.patch<any>(`${this.apiUrl}/courses/modules/${moduleId}`, module);
  }
  createLesson(lesson: LessonRequest, topicId: string) {
    return this.http.post<any>(`${this.apiUrl}/courses/topics/${topicId}/lessons`, lesson);
  }


  updateCourseWithCover(formData: FormData, courseId: string) {
    return this.http.patch<any>(`${this.apiUrl}/courses/${courseId}`, formData);
  }
  
  
  
  getCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }



  getCourseProgress(courseId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/progress/course/${courseId}`);
}

completeLesson(lessonId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/progress/lesson/${lessonId}`, {lessonId});
}
getMyCoursesForStudent(){
  return this.http.get(`${this.apiUrl}/auth/me/courses`);
}

// Методы для работы с деталями курса
createCourseDetails(details: CreateCourseDetailsRequest): Observable<CourseDetails> {
  return this.http.post<CourseDetails>(`${this.apiUrl}/course-details`, details);
}

getCourseDetails(courseId: string): Observable<CourseDetails> {
  return this.http.get<CourseDetails>(`${this.apiUrl}/course-details/${courseId}`);
}

updateCourseDetails(courseId: string, details: UpdateCourseDetailsRequest): Observable<CourseDetails> {
  return this.http.patch<CourseDetails>(`${this.apiUrl}/course-details/${courseId}`, details);
}

deleteCourseDetails(courseId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/course-details/${courseId}`);
}
createTest(test: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/tests`, test);
}

  // getCourseByIdWithModules(id: string) {
  //   return this.http.get<CourseResponse>(`${this.apiUrl}courses/${id}`);
  // }
  // getUnpublishedCourses() {
  //   return this.http.get<Course[]>(`${this.apiUrl}courses/unpublished`);
  // }
}
