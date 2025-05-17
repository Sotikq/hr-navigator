import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  registerSuccess = '';
  registerError = '';
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}
  initForms(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required]],
        surname: ['', [Validators.required]],
        middlename: [''],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            (control: AbstractControl) => {
              const value = control.value;
              if (!value) return null;

              const errors: any = {};

              if (!/\d/.test(value)) errors.missingNumber = true;
              if (!/[A-Z]/.test(value)) errors.missingUppercase = true;
              if (!/[a-z]/.test(value)) errors.missingLowercase = true;

              return Object.keys(errors).length ? errors : null;
            },
          ],
        ],
        confirmPassword: ['', Validators.required],
        acceptTerms: [false, Validators.requiredTrue],
      },
      {
        validators: [
          (form: AbstractControl) => {
            const password = form.get('password')?.value;
            const confirm = form.get('confirmPassword')?.value;
            return password === confirm ? null : { mismatch: true };
          },
        ],
      }
    );
  }
  ngOnInit(): void {
    this.initForms();
  }

  onTermsCheck(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.registerForm.get('acceptTerms')?.setValue(isChecked);
  }

  private markFormGroupTouched(formGroup: FormGroup | AbstractControl) {
    if (formGroup instanceof FormGroup) {
      Object.values(formGroup.controls).forEach((control) => {
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        } else {
          control.markAsTouched();
        }
      });
    }
  }
  onRegister() {
    // Проверяем, что форма валидна
    if (this.registerForm.invalid) {
      // Помечаем все поля как "touched" для отображения ошибок
      this.markFormGroupTouched(this.registerForm);

      // Устанавливаем общее сообщение об ошибке
      this.registerError =
        'Пожалуйста, заполните все обязательные поля правильно';

      return;
    }

    const email = this.registerForm.get('email')?.value;
    const username = `${this.registerForm.get('name')?.value} ${
      this.registerForm.get('surname')?.value
    } ${this.registerForm.get('middlename')?.value}`;
    const password = this.registerForm.get('password')?.value;
    const role = 'user';

    console.log(email, username, password, role);
    this.authService
      .register({
        email: email,
        name: username,
        password: password,
        role: 'student',
      })
      .subscribe({
        next: (res) => {
          alert('Регистрация прошла успешно!');
          this.router.navigate(['']);
        },
        error: (err) => {
          alert(err.error.error || 'Ошибка регистрации');
          console.error(err);
        },
      });
  }
}
