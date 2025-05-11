import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';

interface User {
  email: string;
  username: string;
  password: string;
  role: 'student' | 'teacher';
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  users: User[] = [];
  registerSuccess = '';
  registerError = '';
  loginError = '';
  loginSuccess = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

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
      rememberMe: [false],
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  onLogin() {
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    this.authService
    .login({ email: email, password: password })
    .subscribe({
      next: (res) => {
        this.authService.saveToken(res.token);
          console.log(res.token);

          this.authService.loadUserProfile().subscribe({
            next: (user) => {
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.authService.setUser(user);
              alert('Вы успешно вошли в систему!');
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Ошибка загрузки профиля', err);
            }
          });
          alert('Вы успешно вошли в систему!');
        },
        error: (err) => {
          alert(err.error.error || 'Ошибка входа в систему');
          console.error(err);
        },
      });
    }
    
    onRegister() {
      const email = this.registerForm.get('email')?.value;
      const username = this.registerForm.get('username')?.value;
      const password = this.registerForm.get('password')?.value;
      const role = "user";
      console.log(email, password, role);
      this.authService
      .register({ email: email, name:username, password: password ,  role: "zxc"})
      .subscribe({
        next: (res) => {
          alert('Регистрация прошла успешно!');
        },
        error: (err) => {
          alert(err.error.error || 'Ошибка регистрации');
          console.error(err);
        },
      });
    }
    
  //   login(): void {
  //     this.loginError = '';
  //     this.loginSuccess = '';
      
  //     const { email, password, rememberMe } = this.loginForm.value;
      
  //     const user = this.users.find(
  //       (u) => u.email === email && u.password === password
  //   );
    
  //   if (!user) {
  //     this.loginError = 'Неверный email или пароль';
  //     return;
  //   }
    
  //   this.loginSuccess = `Добро пожаловать, ${user.username}!`;
    
  //   const sessionUser = {
  //     email: user.email,
  //     username: user.username,
  //     role: user.role,
  //   };
    
  //   if (rememberMe) {
  //     localStorage.setItem('currentUser', JSON.stringify(sessionUser));
  //   } else {
  //     sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
  //   }
    
  //   this.loginForm.reset();
  // }
  // register(): void {
  //   this.registerError = '';
  //   this.loginSuccess = '';
  
  //   const { email, username, password, confirmPassword } =
  //     this.registerForm.value;
  
  //   if (password !== confirmPassword) {
  //     this.registerError = 'Пароли не совпадают';
  //     return;
  //   }
  
  //   const existingUser = this.users.find((user) => user.email === email);
  //   if (existingUser) {
  //     this.registerError = 'Пользователь с таким email уже существует';
  //     return;
  //   }
  
  //   const newUser: User = {
  //     email,
  //     username,
  //     password,
  //     role: 'student', // вручную можно поменять в localStorage
  //   };
  //   this.users.push(newUser);
  //   localStorage.setItem('users', JSON.stringify(this.users));
  
  //   this.registerSuccess = 'Вы успешно зарегистрированы!';
  //   this.registerForm.reset();
  // }
}
