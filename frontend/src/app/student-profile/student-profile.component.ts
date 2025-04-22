import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-profile',
  imports: [RouterModule],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.scss'
})
export class StudentProfileComponent {

  tabs = ['profile', 'certificates', 'settings'];

  currentPage: string = 'profile'; // Default page is 'profile'
  constructor() { }
  currentPageSwitch(page: string) {
    this.currentPage = page;  
    console.log(this.currentPage);
  }
}
