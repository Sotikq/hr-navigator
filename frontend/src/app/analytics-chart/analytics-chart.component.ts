import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-analytics-chart',
  templateUrl: './analytics-chart.component.html',
  styleUrls: ['./analytics-chart.component.scss'],
})
export class AnalyticsChartComponent implements OnInit {
  @ViewChild('analyticsChart', { static: true }) chartRef!: ElementRef;
  private chart: Chart | undefined;

  ngOnInit(): void {
    this.createChart();
  }

  createChart() {
    // Регистрируем все необходимые компоненты Chart.js
    Chart.register(...registerables);

    const ctx = this.chartRef.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["HR Basics", "Soft Skills", "Leadership", "HR 2.0"],
        datasets: [{
          label: "Завершили курс",
          data: [24, 18, 15, 30],
          backgroundColor: "#6C5CE7",
          borderRadius: 10,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            type: 'linear' // Явно указываем тип шкалы
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  } 
}