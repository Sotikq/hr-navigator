import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface User {
  email: string;
  username: string;
  password: string;
  role: 'student' | 'teacher';
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})



export class LoginComponent {
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  users: User[] = [];
  registerSuccess = '';
  registerError = '';
  loginError = '';
  loginSuccess = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    }
  }

  initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  register(): void {
    this.registerError = '';
    this.loginSuccess = '';

    const { email, username, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.registerError = 'Пароли не совпадают';
      return;
    }

    const existingUser = this.users.find(user => user.email === email);
    if (existingUser) {
      this.registerError = 'Пользователь с таким email уже существует';
      return;
    }

    const newUser: User = {
      email,
      username,
      password,
      role: 'student'  // вручную можно поменять в localStorage
    };

    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));

    this.registerSuccess = 'Вы успешно зарегистрированы!';
    this.registerForm.reset();
  }

  login(): void {
    this.loginError = '';
    this.loginSuccess = '';

    const { email, password, rememberMe } = this.loginForm.value;

    const user = this.users.find(u => u.email === email && u.password === password);

    if (!user) {
      this.loginError = 'Неверный email или пароль';
      return;
    }

    this.loginSuccess = `Добро пожаловать, ${user.username}!`;

    const sessionUser = {
      email: user.email,
      username: user.username,
      role: user.role
    };

    if (rememberMe) {
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    } else {
      sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
    }

    this.loginForm.reset();
  }
}
