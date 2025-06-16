import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email: string = '';
  sent: boolean = false;
  constructor(private authService: AuthService) {}
  forgotPassword(email: string) {
    this.sent = true;
    this.authService.forgorPassword(email).subscribe({
      next: (res) => {
        // Email sent successfully
      },
      error: (err) => {
        // Error sending email
      },
    });
  }
}
