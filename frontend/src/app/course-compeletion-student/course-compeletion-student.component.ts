import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService1 } from '../course1.service';
import { lessonModel } from '../models/course.models11';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons?: {  // Добавляем знак вопроса, указывая что поле может отсутствовать
    lesson_id: string;
    completed_at: string | null;
  }[];
}

@Component({
  selector: 'app-course-compeletion-student',
  imports: [CommonModule],
  templateUrl: './course-compeletion-student.component.html',
  styleUrl: './course-compeletion-student.component.scss',
})
export class CourseCompeletionStudentComponent implements OnInit {
  courseId: string | null = null;
  currentCourse: any;
  currentModuleIndex = 0;
  currentLessonIndex = 0;
  courseProgress: CourseProgress | null = null;
  loading = true;
  progressPercentage = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService1,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.loadCourse(this.courseId);
      this.loadCourseProgress(this.courseId);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  loadCourse(courseId: string): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.currentCourse = course;
        console.log('Курс загружен:', this.currentCourse);
      },
      error: (err) => {
        console.error('Ошибка загрузки курса:', err);
      },
    });
  }

  loadCourseProgress(courseId: string): void {
    this.courseService.getCourseProgress(courseId).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.courseProgress = response.data;
          this.progressPercentage = response.data.progress;
        }
        this.loading = false;
        console.log('Прогресс курса загружен:', response);
      },
      error: (err) => {
        console.error('Ошибка загрузки прогресса:', err);
        this.loading = false;
      }
    });
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    const videoId = this.extractYoutubeId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  private extractYoutubeId(url: string): string | null {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  isYoutubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

 isLessonCompleted(moduleId: string, lessonId: string): boolean {
  // Проверяем наличие данных о прогрессе
  if (!this.courseProgress || !this.courseProgress.lessons) {
    return false;
  }
  
  // Ищем урок в массиве completed lessons
  const completedLesson = this.courseProgress.lessons.find(
    lesson => lesson.lesson_id === lessonId
  );
  
  // Возвращаем true, если урок найден и он завершен
  return completedLesson ? completedLesson.completed_at !== null : false;
}

  navigateToLesson(moduleIndex: number, lessonIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentLessonIndex = lessonIndex;
  }

  completeLesson(moduleId: string, lessonId: string): void {
    if (!this.courseId) return;
    console.log(lessonId, 'lessonId');
    this.courseService.completeLesson( lessonId).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadCourseProgress(this.courseId!);
        }
      },
      error: (err) => {
        console.error('Ошибка при завершении урока:', err);
      }
    });
  }

  nextLesson(): void {
    const currentModule = this.currentCourse.modules[this.currentModuleIndex];
    if (this.currentLessonIndex < currentModule.lessons.length - 1) {
      this.currentLessonIndex++;
    } else if (this.currentModuleIndex < this.currentCourse.modules.length - 1) {
      this.currentModuleIndex++;
      this.currentLessonIndex = 0;
    }
  }

  getCurrentLesson(): lessonModel | null {
    if (
      !this.currentCourse?.modules ||
      this.currentModuleIndex >= this.currentCourse.modules.length ||
      this.currentLessonIndex >=
        this.currentCourse.modules[this.currentModuleIndex].lessons.length
    ) {
      return null;
    }
    return this.currentCourse.modules[this.currentModuleIndex].lessons[
      this.currentLessonIndex
    ];
  }

  goBack(): void {
    this.router.navigate(['/courses']);
  }
}