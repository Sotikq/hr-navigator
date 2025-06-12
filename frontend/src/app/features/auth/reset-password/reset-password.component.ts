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
    console.log(this.token);
  }
  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router, ) {}
  resetPassword() {
    console.log(this.password, this.token, 'passs');
    if (this.password !== this.confirmPassword) {
      console.log('Пароли не совпадают');
      return;
    }
    console.log(this.token, this.password);
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        console.log(res);
        this.success = 'Пароль успешно сброшен';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log(err);
        this.error = 'Ошибка при сбросе пароля';
      },
    });
  }
}
