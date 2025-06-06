import { Component, OnInit } from '@angular/core';
import { Course } from '../../../../shared/models/courses';
import { CourseDetails } from '../../../../shared/models/course.models11';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../../services/course.service';
import { PaymentService } from '../../../../services/payment.service';
import { Router, RouterModule } from '@angular/router';
import { BuyDialogComponent } from '../../../../shared/components/buy-dialog/buy-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-course-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './course-page.component.html',
  styleUrl: './course-page.component.scss',
})
export class CoursePageComponent implements OnInit {
  course: Course | undefined;
  courseDetails: CourseDetails | undefined;
  id: string | null;
  isCourseBought: boolean = false;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private crs: CourseService,
    private paymentService: PaymentService,
    public router: Router,
    private dialog: MatDialog
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(this.id, typeof this.id);
  }

  ngOnInit() {
    if (this.id) {
      // Загружаем курс и детали курса параллельно
      this.loadCourseData();
    } else {
      console.error('Invalid course ID: null');
      this.isLoading = false;
    }
  }

  private loadCourseData(): void {
    if (!this.id) return;

    // Загружаем основную информацию о курсе
    this.crs.getCourseById(this.id).subscribe({
      next: (data) => {
        this.course = data;
        console.log('Course loaded:', this.course);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.isLoading = false;
      }
    });

    // Загружаем детали курса
    this.crs.getCourseDetails(this.id).subscribe({
      next: (details) => {
        this.courseDetails = details;
        console.log('Course details loaded:', this.courseDetails);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.log('No course details found or error loading details:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    // Проверяем, загружены ли основные данные курса
    if (this.course) {
      this.isLoading = false;
    }
  }

  // Метод для получения текста из study_details
  getStudyDetailsText(): string {
    if (this.courseDetails?.study_details && typeof this.courseDetails.study_details === 'object') {
      return this.courseDetails.study_details.content || '';
    }
    return '';
  }

  // Getter для безопасного доступа к курсу
  get currentCourse(): Course {
    return this.course!;
  }

  buyCourse() {
    this.dialog.open(BuyDialogComponent, {
      data: {
        message: this.id,
        courseId: this.id!
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isCourseBought = true;
      }
    });
  }
}
