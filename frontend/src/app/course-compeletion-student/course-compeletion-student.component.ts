import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService1 } from '../course1.service';
import { lessonModel } from '../models/course.models11';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Course } from '../courses';

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
  progress: { [moduleId: string]: { [lessonId: string]: boolean } } = {};

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
    } else {
      this.router.navigate(['/courses']);
    }
  }

  getSafeYoutubeUrl(url: string) {
    const videoId = this.extractYoutubeId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  private extractYoutubeId(url: string): string | null {
    // Разбираем URL чтобы получить ID видео
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }
  isYoutubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  loadCourse(courseId: string): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.currentCourse = course;
        this.loadProgress(); // Загружаем прогресс из localStorage
      },
      error: (err) => {
        console.error('Ошибка загрузки курса:', err);
      },
    });
  }

  // Загрузка прогресса из localStorage
  loadProgress(): void {
    console.log(this.currentCourse);
    const savedProgress = localStorage.getItem(
      `courseProgress_${this.courseId}`
    );
    if (savedProgress) {
      this.progress = JSON.parse(savedProgress);
    }
  }

  // Сохранение прогресса в localStorage
  saveProgress(): void {
    localStorage.setItem(
      `courseProgress_${this.courseId}`,
      JSON.stringify(this.progress)
    );
  }

  // Отметить урок как пройденный
  completeLesson(moduleId: string, lessonId: string): void {
    if (!this.progress[moduleId]) {
      this.progress[moduleId] = {};
    }
    this.progress[moduleId][lessonId] = true;
    this.saveProgress();
  }

  // Переключение между уроками
  navigateToLesson(moduleIndex: number, lessonIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentLessonIndex = lessonIndex;
  }

  // Переход к следующему уроку
  nextLesson(): void {
    const currentModule = this.currentCourse.modules[this.currentModuleIndex];
    if (this.currentLessonIndex < currentModule.lessons.length - 1) {
      this.currentLessonIndex++;
    } else if (
      this.currentModuleIndex <
      this.currentCourse.modules.length - 1
    ) {
      this.currentModuleIndex++;
      this.currentLessonIndex = 0;
    }
  }

  // Проверка, пройден ли урок
  isLessonCompleted(moduleId: string, lessonId: string): boolean {
    return this.progress[moduleId]?.[lessonId] || false;
  }

  // Получение текущего урока
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
  
}
