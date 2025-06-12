import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  addModuletoCourseRequest,
  createCourseRequest,
  UpdatedCourseRequest,
  lessonModel,
  updatedModuleRequest,
  LessonRequest,
  TopicRequest,
  Topic,
  updatedTopicRequest,
  CourseDetails,
  CreateCourseDetailsRequest,
  UpdateCourseDetailsRequest,
} from '../../../../shared/models/course.models11';
import { CourseService } from '../../../../services/course.service';
import { lastValueFrom } from 'rxjs';
import { Course } from '../../../../shared/models/courses';
import { Lesson, Module } from '../../../../shared/models/course.models11';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-create-course1',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-course1.component.html',
  styleUrl: './create-course1.component.scss',
})
export class CreateCourse1Component implements OnInit {
  currentCourse: any;
  courseLoaded = false;
  isSaving = false;
  isSavingCourse = false;
  coverPreviewUrl: string | null = null;

  selectedCoverFile: File | null = null;

  // Поля для работы с деталями курса
  courseDetails: CourseDetails = {
    course_id: '',
    target_audience: '',
    learning_outcomes: '',
    study_details: {
      content: '',
      updated_at: new Date().toISOString()
    },
    study_period: '',
    goal: ''
  };
  courseDetailsLoaded = false;
  isSavingDetails = false;

  constructor(
    private crs: CourseService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id !== '0' && id !== null) {
        this.crs.getCourseById(id).subscribe((course) => {
          this.currentCourse = course;
          this.courseLoaded = true;
          console.log(this.currentCourse);
          // Загружаем детали курса
          this.loadCourseDetails(id);
        });
      } else {
        const formData = new FormData();
        formData.append('title', 'qweqwe');
        formData.append('description', '');
        formData.append('details', '');
        formData.append('duration', '');
        formData.append('category', '');

        this.createCourseFromStart(formData)
          .then((courseId) => {
            this.router.navigate([`/edit/${courseId}`]);
          })
          .catch((error) => {
            console.error('Failed to create course:', error);
            // Можно показать уведомление об ошибке пользователю
            alert('Ошибка при создании курса. Попробуйте еще раз.');
          });
      }
    });
  }

  onUploadTest(lesson: any) {
    console.log(lesson);
    this.crs.createTest(lesson).subscribe({
      next: (test) => {
        
        console.log(test);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  async createCourseFromStart(data: any) {
    try {
      // Создаем курс
      const courseResponse = await lastValueFrom(this.crs.createCourse(data));
      const courseId = courseResponse.id;
      
      // Создаем пустые детали курса для нового курса
      const emptyDetails: CreateCourseDetailsRequest = {
        course_id: courseId,
        target_audience: '',
        learning_outcomes: '',
        study_details: {
          content: '',
          updated_at: new Date().toISOString()
        },
        study_period: '',
        goal: ''
      };
      
      // Создаем детали курса
      await lastValueFrom(this.crs.createCourseDetails(emptyDetails));
      
      console.log('Course and course details created successfully');
      return courseId;
    } catch (error) {
      console.error('Error creating course or course details:', error);
      throw error;
    }
  }

  // Методы для работы с деталями курса
  loadCourseDetails(courseId: string): void {
    this.crs.getCourseDetails(courseId).subscribe({
      next: (details) => {
        this.courseDetails = details;
        this.courseDetailsLoaded = true;
        console.log('Course details loaded:', this.courseDetails);
      },
      error: (error) => {
        console.log('No course details found, creating empty details');
        // Если деталей нет, создаем пустые
        this.courseDetails = {
          course_id: courseId,
          target_audience: '',
          learning_outcomes: '',
          study_details: {
            content: '',
            updated_at: new Date().toISOString()
          },
          study_period: '',
          goal: ''
        };
        this.courseDetailsLoaded = true;
      }
    });
  }

  async onSaveCourseDetails(): Promise<void> {
    this.isSavingDetails = true;
    try {
      if (!this.courseDetails.course_id) {
        this.courseDetails.course_id = this.currentCourse.id;
      }

      if (this.courseDetails.id) {
        // Обновляем существующие детали
        const updateRequest: UpdateCourseDetailsRequest = {
          target_audience: this.courseDetails.target_audience,
          learning_outcomes: this.courseDetails.learning_outcomes,
          study_details: this.courseDetails.study_details,
          study_period: this.courseDetails.study_period,
          goal: this.courseDetails.goal
        };
        
        const updatedDetails = await lastValueFrom(
          this.crs.updateCourseDetails(this.courseDetails.course_id, updateRequest)
        );
        this.courseDetails = updatedDetails;
        console.log('Course details updated successfully', updatedDetails);
      } else {
        // Создаем новые детали
        const createRequest: CreateCourseDetailsRequest = {
          course_id: this.courseDetails.course_id,
          target_audience: this.courseDetails.target_audience,
          learning_outcomes: this.courseDetails.learning_outcomes,
          study_details: this.courseDetails.study_details,
          study_period: this.courseDetails.study_period,
          goal: this.courseDetails.goal
        };

        const newDetails = await lastValueFrom(
          this.crs.createCourseDetails(createRequest)
        );
        this.courseDetails = newDetails;
        console.log('Course details created successfully', newDetails);
      }
    } catch (error) {
      console.error('Error saving course details', error);
    } finally {
      this.isSavingDetails = false;
    }
  }

  async onDeleteCourseDetails(): Promise<void> {
    if (!this.courseDetails.course_id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, что хотите удалить детали курса?' },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await lastValueFrom(this.crs.deleteCourseDetails(this.courseDetails.course_id));
          // Сбрасываем детали курса
          this.courseDetails = {
            course_id: this.currentCourse.id,
            target_audience: '',
            learning_outcomes: '',
            study_details: {
              content: '',
              updated_at: new Date().toISOString()
            },
            study_period: '',
            goal: ''
          };
          console.log('Course details deleted successfully');
        } catch (error) {
          console.error('Error deleting course details', error);
        }
      }
    });
  }

  // Метод для выбора файла
  onImageUpload(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.currentCourse.cover_url = file;
  
      // Предпросмотр изображения
      this.coverPreviewUrl = URL.createObjectURL(file);
      console.log(this.coverPreviewUrl);
      
    }
  }
  

  async onSaveCourse(): Promise<void> {
    this.onSaveCourseDetails()
    this.isSaving = true;
    try {
      if (!this.currentCourse) return;

      // Создаем FormData
      const formData = new FormData();

      // Добавляем текстовые данные
      formData.append('title', this.currentCourse.title.toString());
      formData.append('description', this.currentCourse.description.toString());
      formData.append('details', this.currentCourse.details.toString());
      formData.append('price', this.currentCourse.price.toString());
      formData.append('duration', this.currentCourse.duration.toString());
      formData.append('category', this.currentCourse.category.toString());
      formData.append(
        'is_published',
        this.currentCourse.is_published ? 'true' : 'false'
      );

      // Добавляем файл обложки, если он был выбран
      if (this.currentCourse.cover_url) {
        formData.append('cover_url', this.currentCourse.cover_url);
      }

      // Отправляем FormData на сервер
      // formData.forEach((value, key) => {
      //   console.log(key, value);
      // });
      const updatedCourse = await lastValueFrom(
        this.crs.updateCourseWithCover(formData, this.currentCourse.id)
      );

      this.selectedCoverFile = null;
      
      console.log('Course updated successfully', updatedCourse);
    } catch (error) {
      console.error('Error updating course', error);
    } finally {
      this.isSaving = false;
    }
  }

  async save() {
    this.isSavingCourse = true;
    try {
      this.updatePositions();

      console.log(this.currentCourse.modules);
      if (this.currentCourse.modules) {
        for (const module of this.currentCourse.modules) {
          if (module.topics) {
            for (const topic of module.topics) {
              if (topic.lessons) {
                for (const lesson of topic.lessons) {
                  const answer = await lastValueFrom(
                    this.crs.updateLesson(lesson, lesson.id)
                  );
                }
              }
              const updatedTopic: updatedTopicRequest = {
                id: topic.id,
                title: topic.title,
                description: topic.description,
                position: topic.position,
              };
              const answer = await lastValueFrom(
                this.crs.updateTopic(updatedTopic, topic.id)
              );
            }
          }
          const updatedModule: updatedModuleRequest = {
            id: module.id,
            title: module.title,
            description: module.description,
            position: module.position,
          };
          const answermodule = await lastValueFrom(
            this.crs.updateModule(updatedModule, module.id)
          );
        }
      }
      if (this.currentCourse) {
        const UpdatedCourseRequest: UpdatedCourseRequest = {
          id: this.currentCourse.id,
          title: this.currentCourse.title,
          description: this.currentCourse.description,
          details: this.currentCourse.details,
          price: this.currentCourse.price,
          duration: this.currentCourse.duration,
          cover_url: this.currentCourse.cover_url,
          category: this.currentCourse.category,
          is_published: this.currentCourse.is_published,
        };
        const anwserCourse = await lastValueFrom(
          this.crs.updateCourse(UpdatedCourseRequest, this.currentCourse.id)
        );

        this.currentCourse = this.crs
          .getCourseById(this.currentCourse.id)
          .subscribe({
            next: (course) => {
              this.currentCourse = course;
              console.log('COURSE FROM SUBMITT', this.currentCourse);
            },
            error: (error) => {
              console.error(error);
            },
          });
      }
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      this.isSavingCourse = false;
    }
  }

  private updatePositions(): void {
    if (!this.currentCourse.modules) return;
    
    this.currentCourse.modules.forEach((module: Module, moduleIndex: number) => {
      module.position = moduleIndex;
      
      if (module.topics) {
        module.topics.forEach((topic, topicIndex) => {
          topic.position = topicIndex;
          
          if (topic.lessons) {
            topic.lessons.forEach((lesson, lessonIndex) => {
              lesson.position = lessonIndex;
            });
          }
        });
      }
    });
  }

  onSubmit() {}

  addModule() {
    const createdModule: addModuletoCourseRequest = {
      title: '',
      description: '',
      positon: 0,
    };
    console.log(createdModule);
    this.crs.addModuletoCourse(createdModule, this.currentCourse.id).subscribe({
      next: (module) => {
        console.log(module);
        this.currentCourse.modules.push({
          ...module,
          topics: [] as Topic[],
        });
        console.log(this.currentCourse.modules);
      },
      error: (error) => {
        console.error('error adding module', error);
      },
    });
  }
  addTopic(module: any) {
    const createdTopic: TopicRequest = {
      title: '',
      description: '',
      position: 0,
    };
    this.crs.addTopicToModule(createdTopic, module.id).subscribe({
      next: (topic) => {
        module.topics.push({ ...topic, lessons: [] as Lesson[] });
        console.log(module.topics);
      },
    });
  }
  deleteTopic(topicId: string, module: Module) {
    this.crs.deleteTopic(topicId).subscribe({
      next: () => {
        module.topics = module.topics.filter(
          (topic: Topic) => topic.id !== topicId
        );
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  //  onLessonVideoUpload() {}
  addLesson(topic: any) {
    const createdLesson: LessonRequest = {
      topicId: topic.id,
      title: '',
      type: 'video',
      content_url: '',
      description: '',
      position: 0,
      // created_at: "",
    };
    console.log(topic);
    this.crs.createLesson(createdLesson, topic.id).subscribe({
      next: (next) => {
        topic.lessons.push(next);
        console.log(next);
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
  onDeleteCourse(id: Course['id']) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить курс?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteCourse(id).subscribe({
          next: (next) => {
            console.log(next);
            this.router.navigate(['/admin']);
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }
  onDeleteModule(id: Module['id']) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить модуль?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteModule(id).subscribe({
          next: () => {
            this.currentCourse.modules = this.currentCourse.modules.filter(
              (module: Module) => module.id !== id
            );
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }
  onDeleteLesson(id: Lesson['id'], topic: Topic) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Вы уверены, то что хотите удалить урок?'},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.crs.deleteLesson(id).subscribe({
          next: () => {
            topic.lessons = topic.lessons.filter(
              (lesson: Lesson) => lesson.id !== id
            );
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }

  // Методы для работы с JSONB study_details как простым текстом
  getStudyDetailsText(): string {
    try {
      // Если study_details это объект с полем content, возвращаем content
      if (this.courseDetails.study_details && typeof this.courseDetails.study_details === 'object') {
        return this.courseDetails.study_details.content || '';
      }
      return '';
    } catch (error) {
      console.error('Error getting study_details text:', error);
      return '';
    }
  }

  setStudyDetailsText(text: string): void {
    try {
      // Оборачиваем текст в объект для сохранения в JSONB
      this.courseDetails.study_details = {
        content: text || '',
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error setting study_details text:', error);
    }
  }
  goBack() {
    this.router.navigate(['/admin']);
  }
}
