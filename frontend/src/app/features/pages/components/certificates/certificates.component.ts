import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../../../../services/certificate.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-certificates',
  imports: [CommonModule, RouterModule],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.scss'
})
export class CertificatesComponent implements OnInit {
  certificate: any = null;
  code: string = '';
  loading: boolean = false;
  
    constructor(private certificateService: CertificateService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.code = this.route.snapshot.queryParams['code'];
    console.log(this.code);
    
    if (this.code) {
      this.certificateGet();
    }
  }

  async certificateGet() {
    try {
      this.loading = true;
      this.certificate = await lastValueFrom(this.certificateService.getCertificate(this.code));
      console.log('Certificate data:', this.certificate);
      console.log('Certificate keys:', Object.keys(this.certificate));
      
      // Проверяем статус сертификата
      if (this.certificate.status !== 'valid') {
        console.warn('Certificate status is not valid:', this.certificate.status);
        this.certificate = null;
        return;
      }
      
      if (this.certificate.certificate) {
        console.log('Certificate inner keys:', Object.keys(this.certificate.certificate));
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      this.certificate = null;
    } finally {
      this.loading = false;
    }
  }

  

  printValidation() {
    window.print();
  }

  shareValidation() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Подтверждение сертификата HR Navigator',
        text: `Сертификат ${this.getCertNumber()} подтвержден для ${this.getRecipientName()}`,
        url: url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Ссылка для проверки сертификата скопирована в буфер обмена');
    }
  }

  reloadPage() {
    window.location.reload();
  }

  getCurrentDateTime(): Date {
    return new Date();
  }

  // Helper methods to get certificate data
  getRecipientName(): string {
    if (!this.certificate || !this.certificate.certificate) return 'Имя получателя';
    return this.certificate.certificate.userName || 'Имя получателя';
  }

  getCourseTitle(): string {
    if (!this.certificate || !this.certificate.certificate) return 'Название курса';
    return this.certificate.certificate.courseTitle || 'Название курса';
  }

  getStartDate(): string {
    if (!this.certificate || !this.certificate.certificate) return '01.01.2024';
    
    // Получаем дату выдачи и вычитаем примерно 2 месяца для начала курса
    const issueDate = new Date(this.certificate.certificate.issuedAt);
    const startDate = new Date(issueDate);
    startDate.setMonth(startDate.getMonth() - 2);
    
    return startDate.toLocaleDateString('ru-RU');
  }

  getEndDate(): string {
    if (!this.certificate || !this.certificate.certificate) return '31.12.2024';
    
    // Используем дату выдачи как дату окончания курса
    const issueDate = new Date(this.certificate.certificate.issuedAt);
    return issueDate.toLocaleDateString('ru-RU');
  }

  getHours(): string {
    if (!this.certificate || !this.certificate.certificate) return '72';
    // Проверяем, есть ли поле с часами в данных
    return this.certificate.certificate.hours || 
           this.certificate.certificate.duration || 
           '72'; // значение по умолчанию
  }

  getCertNumber(): string {
    if (!this.certificate || !this.certificate.certificate) return 'Номер';
    return this.certificate.certificate.certificateNumber || 'Номер';
  }

  getIssueDate(): Date | null {
    if (!this.certificate || !this.certificate.certificate) return null;
    const dateString = this.certificate.certificate.issuedAt;
    return dateString ? new Date(dateString) : null;
  }
}
