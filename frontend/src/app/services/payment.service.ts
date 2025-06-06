import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  buyCourse(courseId: string, phone: string) {
    return this.http.post(`${this.apiUrl}/payments`, { course_id: courseId, phone : phone});
  }
  getPayments() {
    return this.http.get(`${this.apiUrl}/payments/pending`);
  }
  approvePayment(paymentId: string) { 
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/confirm`, {id: paymentId});
  }
  getAllMyPayments() {
    return this.http.get(`${this.apiUrl}/payments/my`);
  }
  rejectPayment(paymentId: string) {
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/reject`, {id: paymentId});
  }
  invoicePayment(paymentId: string) {
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/invoice`, {id: paymentId});
  }
}
