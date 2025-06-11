import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoReviewService {
  private apiUrl = environment.apiUrl + '/uploads';
  constructor(private http: HttpClient) {}
  getVideo(){
    return this.http.get<any>(this.apiUrl);
  }
}
//09a35cf0-cb6b-49f2-91da-b507953ffe73