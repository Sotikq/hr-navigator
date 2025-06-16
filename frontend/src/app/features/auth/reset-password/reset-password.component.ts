import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  password: string = '';
  confirmPassword: string = '';
  public token: string = '';
  error: string = '';
  success: string = '';
  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    // Token extracted from URL
  }
  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router, ) {}
  resetPassword() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Пароли не совпадают';
      return;
    }
    
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.success = 'Пароль успешно сброшен';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = 'Ошибка при сбросе пароля';
      },
    });
  }
}
