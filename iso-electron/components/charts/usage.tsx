import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components including the Filler plugin for filling beneath lines
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UsageData {
  name: string;
  usage: number;
}

interface UsageChartProps {
  cpuData: UsageData[];
  gpuData: UsageData[];
}

const UsageChart: React.FC<UsageChartProps> = ({ cpuData, gpuData }) => {
  // Function to create gradient fill
  const createGradient = (
    ctx: {
      createLinearGradient: (
        arg0: number,
        arg1: any,
        arg2: number,
        arg3: any
      ) => any;
    },
    chartArea: { bottom: any; top: any },
    colorStart: string,
    colorEnd: string
  ) => {
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.bottom,
      0,
      chartArea.top
    );
    gradient.addColorStop(0, colorEnd);
    gradient.addColorStop(1, colorStart);
    return gradient;
  };

  const chartData = {
    labels: cpuData.map((d) => d.name),
    datasets: [
      {
        label: 'İşlemci Kullanımı',
        data: cpuData.map((d) => d.usage),
        borderColor: '#007bff',
        backgroundColor: function (context: { chart: any }) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This case happens on initial chart load
            return;
          }
          return createGradient(
            ctx,
            chartArea,
            'rgba(0, 123, 255, 0.5)',
            'rgba(0, 123, 255, 0)'
          );
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Ekran Kartı Kullanımı',
        data: gpuData.map((d) => d.usage),
        borderColor: '#ff6347',
        backgroundColor: function (context: { chart: any }) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This case happens on initial chart load
            return;
          }
          return createGradient(
            ctx,
            chartArea,
            'rgba(255, 99, 71, 0.5)',
            'rgba(255, 99, 71, 0)'
          );
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true, // Start the y-axis from 0
        grid: {
          display: false,
        },
        max: 100, // Set maximum value of y-axis to 100
        title: {
          display: true,
          text: 'Kullanım (%)', // You can modify this title to fit your data context
          color: '#666',
          font: {
            size: 14,
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0, // Optionally hide points
      },
    },
    animation: {
      duration: 1000,
    },
  };

  return (
    <div className='relative w-full h-full'>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default UsageChart;
