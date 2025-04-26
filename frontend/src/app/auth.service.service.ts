import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable(); // для подписки в компоненте


  constructor(private http: HttpClient) {}


  updateName(data: { name: string }) {
    return this.http.patch(`${this.apiUrl}/me/name`, data);
  }
  updatePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
    return this.http.patch(`${this.apiUrl}/me/password`, data);
  }






  register(data: { email: string; name: string, password: string; role: string}) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }
  loadUserProfile() {
    // return this.http.get(`${this.apiUrl}/me`).subscribe({
    //   next: (user) => this.userSubject.next(user),
    //   error: () => this.userSubject.next(null),
    // });
    return this.http.get(`${this.apiUrl}/me`);
  }
  
  setUser(user: any) {
    this.userSubject.next(user);
  }
  
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  logout() {
    localStorage.removeItem('token');
  }
}

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.rkGyfsdfp4t27snxXvn32WJhP4t_zp3OiA
