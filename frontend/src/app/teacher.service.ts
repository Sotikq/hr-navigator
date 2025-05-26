import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from './courses';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
 private apiUrl = environment.apiUrl + '/';
  constructor(private http: HttpClient) {}

  getAllMyCourses(){
    return this.http.get<Course[]>(`${this.apiUrl}courses/my/all`)
  }
}
