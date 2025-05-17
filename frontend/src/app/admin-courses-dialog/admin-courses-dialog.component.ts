import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';

interface Course {
  id: number;
  title: string;
  category: string;
}

interface Teacher {
  id: number;
  name: string;
  courses: Course[];
}

interface DialogData {
  teacher: Teacher;
  allCourses: Course[];
}

@Component({
  selector: 'app-teacher-courses-dialog',
  imports: [ CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatListModule,
],
  templateUrl: './admin-courses-dialog.component.html',
  styleUrl: './admin-courses-dialog.component.scss'
})
export class AdminCoursesDialogComponent  implements OnInit {
  filteredCourses: Course[] = [];
  selectedCourse = new FormControl<Course | null>(null);
  

  constructor(
    public dialogRef: MatDialogRef<AdminCoursesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

   ngOnInit(): void {
    // Получаем ID курсов, которые уже есть у учителя
    const teacherCourseIds = this.data.teacher.courses.map(c => c.id);
    
    // Фильтруем - оставляем только курсы, которых нет у учителя
    this.filteredCourses = this.data.allCourses.filter(
      course => !teacherCourseIds.includes(course.id)
    );
  }

  onSave(): void {
    if (this.selectedCourse.value) {
      this.dialogRef.close(this.selectedCourse.value.id);
    }
    //console.log(this.selectedCourse);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}