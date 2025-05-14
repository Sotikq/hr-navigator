import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class adminService {
  private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) { }

  getTeachers(){
    return this.http.get(`${this.apiUrl}auth/teachers`)
  }
}
