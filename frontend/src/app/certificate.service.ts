import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) { }
  getCertificates(){
    return this.http.get(`${this.apiUrl}certificates`);
  }
  createCertificate(courseId: string){
    return this.http.post(`${this.apiUrl}certificates/generate/${courseId}`, {courseId: courseId});
  }
}
