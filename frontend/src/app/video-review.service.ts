import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoReviewService {
  private apiUrl = 'http://localhost:5000/api/';
  constructor(private http: HttpClient) {}
  getVideo(id: string){
    return this.http.get<any>(`${this.apiUrl}reviews`);
  }
}
//09a35cf0-cb6b-49f2-91da-b507953ffe73