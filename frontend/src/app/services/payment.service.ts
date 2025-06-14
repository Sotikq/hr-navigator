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
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/confirm`, {});
  }
  getAllMyPayments() {
    return this.http.get(`${this.apiUrl}/payments/my`);
  }
  rejectPayment(paymentId: string, reason?: string) {
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/reject`, { reason: reason || 'Отклонено администратором' });
  }
  invoicePayment(paymentId: string, invoiceUrl: string) {
    return this.http.patch(`${this.apiUrl}/payments/${paymentId}/invoice`, { invoice_url: invoiceUrl });
  }
}
