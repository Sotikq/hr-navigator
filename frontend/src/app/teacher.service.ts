import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from './courses';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
 private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) {}

  getAllMyCourses(){
    return this.http.get<Course[]>(`${this.apiUrl}courses/my/all`)
  }
}
