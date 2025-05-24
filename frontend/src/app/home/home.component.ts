import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { VideoReviewService } from '../video-review.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { NotificationComponent } from '../components/notification/notification.component';
import { NotificationService } from '../services/notification.service';
import { AuthStateService } from '../services/auth-state.service';
import { take } from 'rxjs/operators';

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

  videos: any;

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
    const videoId = '09a35cf0-cb6b-49f2-91da-b507953ffe73';
    this.videoReviewService.getVideo().subscribe({
      next: (res) => {
        this.videos = res;
        console.log(this.videos);
        this.videoLoaded = true;
        console.log("vidLoad", this.videoLoaded);
      },
      error: (err) => {
        console.error('Ошибка загрузки видео:', err);
      },
    });
    //console.log(this.video);
  }

  //    /uploads/reviews/video-1746383854991-363386328.MP4   как было
}
