import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { CoursesComponent } from "./courses/courses.component";

@Component({
  selector: 'app-root',
  imports: [CoursesComponent,RouterOutlet,RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hr';
  constructor( private router: Router) {}
  goToLogin(){
    this.router.navigate(['/login']);
  }
  goToPage(page: string) {
    this.router.navigate([`/${page}`]);
  }
  goToProfile(){
    this.router.navigate(['/student']);
  }
  currentUserJs = localStorage.getItem('currentUser');
  currentUser = this.currentUserJs ? JSON.parse(this.currentUserJs) : null;
  
  check(){
    console.log(this.currentUser);
  }

  
}
