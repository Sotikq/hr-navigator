import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { VideoReviewService } from '../../../../services/video-review.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { NotificationComponent } from '../../../../shared/components/notification/notification.component';
import { NotificationService } from '../../../../services/notification.service';
import { AuthStateService } from '../../../../services/auth-state.service';
import { take } from 'rxjs/operators';

interface VideoReview {
  file_url: string;
  title?: string;
  description?: string;
  loaded?: boolean;
  duration?: number;
  date?: Date;
  views?: number;
  isPlaying?: boolean;
  thumbnail?: string;
  testimonial?: string;
  author?: {
    name: string;
    avatar: string;
  };
  student?: {
    name: string;
    avatar: string;
    course: string;
    verified: boolean;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  constructor(
    private videoReviewService: VideoReviewService,
    public notificationService: NotificationService,
    private authStateService: AuthStateService
  ) {}

  videos: VideoReview[] = [];
  videoLoaded = false;

  ngOnInit(): void {
    this.getVideo();
    this.authStateService.showLoginSuccess$.pipe(take(1)).subscribe(showSuccess => {
      if (showSuccess) {
        this.notificationService.showSuccess('Вы успешно вошли в систему!');
        this.authStateService.setLoginSuccess(false);
      }
    });
  }
  
  getVideo() {
    // const videoId = '09a35cf0-cb6b-49f2-91da-b507953ffe73';
    // const videoId = '107d6054-bd25-4d73-b91a-407618d9d064';
    // this.videoReviewService.getVideo().subscribe({
    //   next: (res) => {
    //     this.videos = res.map((video: any) => ({
    //       ...video,
    //       isPlaying: false,
    //       loaded: false
    //     }));
    //     console.log(this.videos);
    //     this.videoLoaded = true;
    //     console.log("vidLoad", this.videoLoaded);
    //   },
    //   error: (err) => {
    //     console.error('Ошибка загрузки видео:', err);
    //   },
    // });

    this.videos = [
      {
        file_url: '/uploads/reviews/video-1746383854991-363386328.MP4',
        title: 'Video 1',
        description: 'Description 1',
        loaded: false,
        isPlaying: false,
        thumbnail: 'assets/images/video-placeholder.png',
        testimonial: 'Testimonial 1',
        
      },
      {
        file_url: '/uploads/reviews/video-1746438933445-688574231.MP4',
        title: 'Video 1',
        description: 'Description 1',
        loaded: false,
        isPlaying: false,
        thumbnail: 'assets/images/video-placeholder.png',
        testimonial: 'Отличные курсы! ',
      }
    ];
  }

  playVideo(video: VideoReview, index: number) {
    // Останавливаем все другие видео
    this.videos.forEach((v, i) => {
      if (i !== index) {
        v.isPlaying = false;
      }
    });
    
    // Запускаем выбранное видео
    video.isPlaying = true;
    
    // Находим video элемент и запускаем воспроизведение
    setTimeout(() => {
      const videoElement = document.querySelector(`[data-index="${index}"] video`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.play();
      }
    }, 100);
  }

  onVideoPlay(video: VideoReview) {
    video.isPlaying = true;
  }

  onVideoPause(video: VideoReview) {
    // Можно оставить видео в режиме плеера даже при паузе
    // video.isPlaying = false;
  }

  updateVideoDuration(event: Event) {
    const video = event.target as HTMLVideoElement;
    const videoCard = (event.target as HTMLElement).closest('.video-item');
    if (video && videoCard) {
      const index = Array.from(videoCard.parentElement?.children || []).indexOf(videoCard);
      if (index !== -1 && this.videos[index]) {
        this.videos[index].duration = video.duration;
      }
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  //    /uploads/reviews/video-1746383854991-363386328.MP4   как было
}
