import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  imports: [ CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  mainitem = '/assets/main.jpeg';
  popularCourses = [
    { title: 'Курс 1', subtitle: 'Описание курса 1', badge: 'Топ 1' },
    { title: 'Курс 2', subtitle: 'Описание курса 2', badge: 'Новинка' },
    { title: 'Курс 3', subtitle: 'Описание курса 3', badge: 'Бестселлер' },
    { title: 'Курс 4', subtitle: 'Описание курса 4', badge: 'Топ 2' },
    { title: 'Курс 5', subtitle: 'Описание курса 5', badge: 'Топ 3' },
    { title: 'Курс 6', subtitle: 'Описание курса 6', badge: 'Топ 4' },
    // добавьте больше курсов по необходимости
  ];

  features = [
    { img: 'assets/hr-interview.jpg', alt: 'HR-интервью', text: 'Курсы от практиков HR' },
    { img: 'assets/certificate.jpg', alt: 'Сертификат', text: 'Сертификаты об окончании' },
    { img: 'assets/support.jpg', alt: 'Поддержка', text: 'Поддержка от преподавателей' },
    { img: 'assets/flexible.jpg', alt: 'Гибкий график', text: 'Гибкий график обучения' },
  ];

  reviews = [
    { img: 'assets/student1.jpg', comment: 'Отличный курс! Очень помог мне в карьерном росте.' },
    { img: 'assets/student2.jpg', comment: 'Очень полезные и актуальные знания. Спасибо!' },
    // добавьте больше отзывов
  ];

  steps = [
    'Зарегистрируйтесь',
    'Выберите курс',
    'Учитесь в удобное время'
  ];
}
