import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { VideoReviewService } from '../video-review.service';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  constructor(private videoReviewService: VideoReviewService) {}
  videos: any;

  videoLoaded = false;

  ngOnInit(): void {
    this.getVideo();
  }

  getVideo() {
    const videoId = '09a35cf0-cb6b-49f2-91da-b507953ffe73';
    this.videoReviewService.getVideo(videoId).subscribe({
      next: (res) => {
        this.videos = res;
        console.log(this.videos);
        this.videoLoaded = true;
      },
      error: (err) => {
        console.error('Ошибка загрузки видео:', err);
      },
    });
    //console.log(this.video);
  }

  //    /uploads/reviews/video-1746383854991-363386328.MP4   как было
}
