import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }
  getCertificates(){
    return this.http.get(`${this.apiUrl}certificates`);
  }
  createCertificate(courseId: string){
    return this.http.post(`${this.apiUrl}certificates/generate/${courseId}`, {courseId: courseId});
  }
}
