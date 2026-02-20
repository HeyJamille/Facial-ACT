import { Component, AfterViewInit } from '@angular/core';
import { Header } from '../../../components/header/header';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api-service/api-service';
import { Loading } from '../../../components/ui/loading/loading';
import { ToastrService } from 'ngx-toastr';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Header, NgChartsModule, FormsModule, CommonModule, Loading],
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit {
  isLoading = true;

  totalPessoas = 0;
  faciaisCadastradas = 0;
  faciaisNaoValidadas = 0;

  private pieChartInstance?: Chart;
  private ageChartInstance?: Chart;
  private monthlyChartInstance?: Chart;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
  ) {}

  // 1. Configurações de Dados (Estruturas Iniciais)
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#fbb6ce', '#93c5fd', '#fde68a', '#a7f3d0'],
        borderWidth: 1,
      },
    ],
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right', // Coloca a legenda ao lado
        align: 'center',
        labels: {
          padding: 20,
          boxWidth: 15,
          font: { size: 12 },
        },
      },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Quantidade',
        data: [],
        backgroundColor: '#93c5fd',
        hoverBackgroundColor: '#60a5fa', // Cor quando passa o mouse
        borderColor: '#93c5fd',
        borderWidth: 1,
      },
    ],
  };

  monthlyChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Quantidade',
        data: [],
        backgroundColor: '#93c5fd',
        hoverBackgroundColor: '#60a5fa', // Cor quando passa o mouse
        borderColor: '#93c5fd',
        borderWidth: 1,
      },
    ],
  };

  ngAfterViewInit() {
    // Não chamamos initCharts aqui porque o loading esconde o HTML
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    this.api.getDashboard().subscribe({
      next: (res: any) => {
        // Mapeamento dos Cards
        this.totalPessoas = res.pessoasCadastradas;
        this.faciaisCadastradas = res.faciaisCadastradas;
        this.faciaisNaoValidadas = res.faciaisNaoValidadas;

        // Mapeamento dos Gráficos
        this.pieChartData.labels = res.distribuicaoPorGenero.map((i: any) =>
          this.formatLabel(i.genero),
        );
        this.pieChartData.datasets[0].data = res.distribuicaoPorGenero.map((i: any) => i.total);

        this.barChartData.labels = res.distribuicaoPorFaixaEtaria.map((i: any) =>
          this.formatLabel(i.faixaEtaria),
        );
        this.barChartData.datasets[0].data = res.distribuicaoPorFaixaEtaria.map(
          (i: any) => i.total,
        );

        this.monthlyChartData.datasets[0].data = res.cadastrosRealizadosPorMes.map(
          (i: any) => i.total,
        );

        // A MÁGICA: Finaliza o loading e espera o Angular renderizar o HTML antes de criar os gráficos
        this.isLoading = false;
        setTimeout(() => this.initOrUpdateCharts(), 50);
      },
      error: (err) => {
        if (err.status === 401) {
          this.toastr.warning(
            'Sua sessão expirou. Por favor, faça login novamente.',
            'Sessão Expirada',
          );
          // O Interceptor que criamos cuidará do redirecionamento
        } else {
          this.toastr.error('Erro ao carregar dados da API');
        }

        this.isLoading = false;
      },
    });
  }

  initOrUpdateCharts() {
    // Se as instâncias não existem, cria. Se existem, atualiza.
    if (!this.pieChartInstance) {
      this.initCharts();
    } else {
      this.updateAllCharts();
    }
  }

  initCharts() {
    // Gênero
    const ctxGenres = document.getElementById('pieChart') as HTMLCanvasElement;
    this.pieChartInstance = new Chart(ctxGenres, {
      type: 'pie',
      data: this.pieChartData,
      options: this.pieChartOptions,
    });

    // Idade
    const ctxAge = document.getElementById('barChart') as HTMLCanvasElement;
    this.ageChartInstance = new Chart(ctxAge, {
      type: 'bar',
      data: this.barChartData,
      options: { responsive: true, maintainAspectRatio: false },
    });

    // Mensal
    const ctxMonth = document.getElementById('monthlyChart') as HTMLCanvasElement;
    this.monthlyChartInstance = new Chart(ctxMonth, {
      type: 'bar',
      data: this.monthlyChartData,
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false },
    });
  }

  formatLabel(text: string): string {
    if (!text) return '';
    const upperText = text.toUpperCase().replace(/\s/g, '');
    const manualMap: any = {
      NAOINFORMADO: 'Não Informado',
      NAOBINARIO: 'Não Binário',
      ABAIXODE18: 'Abaixo de 18',
      DE18A25: '18 a 25 anos',
      DE26A35: '26 a 35 anos',
      DE36A45: '36 a 45 anos',
      DE46A60: '46 a 60 anos',
      MAISDE60: 'Mais de 60',
    };
    if (manualMap[upperText]) return manualMap[upperText];
    return text
      .replace(/([0-9]+)/g, ' $1 ')
      .replace(/([A-Z][a-z])/g, ' $1')
      .trim();
  }

  updateAllCharts() {
    this.pieChartInstance?.update();
    this.ageChartInstance?.update();
    this.monthlyChartInstance?.update();
  }
}
