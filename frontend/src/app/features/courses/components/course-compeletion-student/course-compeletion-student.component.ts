import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../services/course.service';
import { lessonModel } from '../../../../shared/models/course.models11';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CertificateService } from '../../../../services/certificate.service';

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons?: {  
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
  currentTopicIndex = 0;
  currentLessonIndex = 0;
  courseProgress: CourseProgress | null = null;
  loading = true;
  progressPercentage = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private sanitizer: DomSanitizer,
    private certificateService: CertificateService
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

  isLessonCompleted(topicId: string, lessonId: string): boolean {
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

  navigateToLesson(moduleIndex: number, topicIndex: number, lessonIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentTopicIndex = topicIndex;
    this.currentLessonIndex = lessonIndex;
  }

  navigateToModule(moduleIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentTopicIndex = 0;
    this.currentLessonIndex = 0;
  }

  navigateToTopic(moduleIndex: number, topicIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentTopicIndex = topicIndex;
    this.currentLessonIndex = 0;
  }

  completeLesson(topicId: string, lessonId: string): void {
    if (!this.courseId) return;
    console.log(lessonId, 'lessonId');
    this.courseService.completeLesson(lessonId).subscribe({
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
    const currentTopic = currentModule.topics[this.currentTopicIndex];
    
    if (this.currentLessonIndex < currentTopic.lessons.length - 1) {
      this.currentLessonIndex++;
    }
    else if (this.currentTopicIndex < currentModule.topics.length - 1) {
      this.currentTopicIndex++;
      this.currentLessonIndex = 0;
    }
    else if (this.currentModuleIndex < this.currentCourse.modules.length - 1) {
      this.currentModuleIndex++;
      this.currentTopicIndex = 0;
      this.currentLessonIndex = 0;
    }
  }

  getCurrentLesson(): lessonModel | null {
    if (
      !this.currentCourse?.modules ||
      this.currentModuleIndex >= this.currentCourse.modules.length ||
      this.currentTopicIndex >= this.currentCourse.modules[this.currentModuleIndex].topics.length ||
      this.currentLessonIndex >= this.currentCourse.modules[this.currentModuleIndex].topics[this.currentTopicIndex].lessons.length
    ) {
      return null;
    }
    return this.currentCourse.modules[this.currentModuleIndex].topics[this.currentTopicIndex].lessons[this.currentLessonIndex];
  }

  getCurrentTopic(): any | null {
    if (
      !this.currentCourse?.modules ||
      this.currentModuleIndex >= this.currentCourse.modules.length ||
      this.currentTopicIndex >= this.currentCourse.modules[this.currentModuleIndex].topics.length
    ) {
      return null;
    }
    return this.currentCourse.modules[this.currentModuleIndex].topics[this.currentTopicIndex];
  }

  isLastLesson(): boolean {
    const currentModule = this.currentCourse?.modules[this.currentModuleIndex];
    const currentTopic = currentModule?.topics[this.currentTopicIndex];
    
    return (
      this.currentModuleIndex === this.currentCourse.modules.length - 1 &&
      this.currentTopicIndex === currentModule.topics.length - 1 &&
      this.currentLessonIndex === currentTopic.lessons.length - 1
    );
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }

  get isCourseCompleted(): boolean {
    if (!this.courseProgress) return false;
    return this.courseProgress.completedLessons === this.courseProgress.totalLessons;
  }

  getCertificate() {
    this.certificateService.createCertificate(this.courseId!).subscribe({
      next: (response) => {
        console.log(response, 'response');
        this.router.navigate(['/student',]);
      },
      error: (err) => {
        console.error('Ошибка при получении сертификата:', err);
      }
    });
  }
}