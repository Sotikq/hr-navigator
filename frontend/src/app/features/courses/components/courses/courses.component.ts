import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, Router } from '@angular/router';
import {  Course } from '../../../../shared/models/courses';

import { CourseService } from '../../../../services/course.service';
@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  courses: Course[] = [];
  selectedCourse: any = null;
  showModal: boolean = false;
  selectedCategory: string = 'all';
  searchQuery: string = '';

  constructor(private router: Router, private crs: CourseService) {
    crs.getCourses().subscribe((data) => {
      this.courses = data;
      console.log(this.courses);
    });
  }

  goToCourse(courseId: any) {
    this.router.navigate(['/course', courseId]);
  }

  openModal(course: any) {
    this.selectedCourse = course;
    this.showModal = true;
    console.log(course);
  }

  closeModal() {
    this.showModal = false;
    this.selectedCourse = null;
  }

  getFilteredCourses(): Course[] {
    return this.courses.filter((course) => {
      // Фильтр по категории
      const categoryMatch =
        this.selectedCategory === 'all' ||
        course.category === this.selectedCategory;

      // Фильтр по поисковому запросу
      const searchMatch =
        !this.searchQuery ||
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (course.description &&
          course.description
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()));

      return categoryMatch && searchMatch;
    });
  }
  onFilterChange() {
  // Можно добавить дополнительную логику при изменении фильтров
  console.log('Filters changed:', {
    category: this.selectedCategory,
    search: this.searchQuery
  });
}
}
