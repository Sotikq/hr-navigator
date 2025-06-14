import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { Teacher } from '../shared/models/teacher.models';
import { Course } from '../shared/models/course.models11';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class adminService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getTeachers(){
    return this.http.get(`${this.apiUrl}/auth/teachers`)
  }

  getTeachersWithCourses(): Observable<any>{
    return this.http.get(`${this.apiUrl}/auth/admin/teachers-with-courses`);
  }
  createTeacher(teacher: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/admin/teachers`, teacher);
  }

  addCourseToTeacher(teacherId: string, courseId: any){
    return this.http.post(`${this.apiUrl}/courses/${courseId}/assign-teacher`, {
    teacher_id: teacherId
  }).pipe(
    switchMap(() => this.getTeacherCourses(teacherId))
  )
  }

  getTeacherCourses(teacherId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/teachers/${teacherId}/courses`);
    
  }

  removeCourseFromTeacher(teacherId: Teacher["id"], courseId: Course["id"]) {
    return this.http.delete(`${this.apiUrl}/auth/admin/teachers/${teacherId}/courses/${courseId}`, {
      body: { teacher_id: teacherId, course_id: courseId }
    }).pipe(
      switchMap(() => this.getTeacherCourses(teacherId))
    );
  }

  getTests(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-results/all?page=${page}&limit=${limit}`);
  }

  importTestResults(importData: {sheetId: string, courseId: string, part: number, range: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-results/import`, importData);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/dashboard`);
  }
}
