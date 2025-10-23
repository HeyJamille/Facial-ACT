import { Component } from '@angular/core';
import { Header } from '../../../components/header/header';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [Header, NgChartsModule, FormsModule, CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  maxLabels = window.innerWidth < 300 ? 6 : 12; // notebook para cima = 12

  pieChartData: ChartData<'pie'> = {
    labels: ['Feminino', 'Masculino', 'Não Binário', 'Prefiro Não Informar'],
    datasets: [
      {
        data: [10, 15, 20, 18], // um valor para cada gênero
        backgroundColor: [
          '#fbb6ce', // rosa pastel
          '#93c5fd', // azul pastel
          '#fde68a', // amarelo pastel
          '#a7f3d0', // verde pastel
        ],
        borderWidth: 2,
      },
    ],
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#374151' },
      },
    },
  };

  // Bar chart data for ages
  barChartData: ChartData<'bar'> = {
    labels: ['18-25', '26-35', '36-45', '46-60', '60+'],
    datasets: [
      {
        label: 'Quantidade de Pessoas',
        data: [12, 20, 15, 8, 5], // exemplo de distribuição
        backgroundColor: [
          '#fbb6ce', // rosa pastel
          '#93c5fd', // azul pastel
          '#fde68a', // amarelo pastel
          '#a7f3d0', // verde pastel
          '#fcd5ce', // vermelho pastel
        ],
        borderColor: ['#fbb6ce', '#93c5fd', '#fde68a', '#a7f3d0', '#fcd5ce'],
        borderWidth: 1,
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5 },
      },
    },
  };

  ngAfterViewInit() {
    const ctxGenres = document.getElementById('pieChart') as HTMLCanvasElement;
    const ctxAge = document.getElementById('barChart') as HTMLCanvasElement;
    const ctxMonth = document.getElementById('monthlyChart') as HTMLCanvasElement;

    new Chart(ctxGenres, {
      type: 'pie',
      data: this.pieChartData,
      options: {
        ...this.pieChartOptions,
        maintainAspectRatio: false,
      },
    });

    new Chart(ctxAge, {
      type: 'bar',
      data: this.barChartData,
      options: {
        ...this.barChartOptions,
        maintainAspectRatio: false,
      },
    });

    new Chart(ctxMonth, {
      type: 'bar',
      data: this.monthlyChartData,
      options: {
        ...this.monthlyChartOptions,
        maintainAspectRatio: false,
      },
    });
  }

  // Registration graph data by month
  monthlyChartData: ChartData<'bar'> = {
    labels: this.labels,
    datasets: [
      {
        label: 'Cadastros no Mês',
        data: [20, 25, 30, 28, 35, 40, 38, 42, 30, 25, 20, 15],
        backgroundColor: '#93c5fd',
        borderColor: ['#93c5fd'],
      },
    ],
  };

  monthlyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        type: 'category',
        ticks: {
          color: '#374151',
          font: { size: 14 },
          padding: 10,
          autoSkip: false, // show all months
        },
      },
      x: {
        beginAtZero: true,
      },
    },
  };
}
