import React, { useRef, useEffect } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TemperatureRecord } from '@/types';

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

interface TempChartProps {
  records: TemperatureRecord[];
  height?: number;
  title?: string;
  compact?: boolean;
}

const TempChart: React.FC<TempChartProps> = ({ records, height = 200, title, compact = false }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const data = {
    labels: records.map((r) => r.timestamp.split(' ')[1] || r.timestamp),
    datasets: [
      {
        label: '温度 (°C)',
        data: records.map((r) => r.temp),
        borderColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return '#2563EB';
          const gradient = chartCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#10B981');
          gradient.addColorStop(0.5, '#2563EB');
          gradient.addColorStop(1, '#EF4444');
          return gradient;
        },
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(37, 99, 235, 0.1)';
          const gradient = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.1)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: records.map((r) => (r.temp > 8 || r.temp < 2 ? (compact ? 3 : 5) : (compact ? 1 : 3))),
        pointBackgroundColor: records.map((r) =>
          r.temp > 8 ? '#EF4444' : r.temp < 2 ? '#F59E0B' : '#2563EB'
        ),
        pointBorderColor: '#fff',
        pointBorderWidth: compact ? 0 : 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#94A3B8',
        font: { size: compact ? 10 : 12, weight: 500 as const },
        padding: { bottom: compact ? 6 : 12 },
      },
      tooltip: {
        backgroundColor: '#0F1D33',
        titleColor: '#E2E8F0',
        bodyColor: '#CBD5E1',
        borderColor: '#1E3354',
        borderWidth: 1,
        padding: compact ? 6 : 10,
        callbacks: {
          label: (context: any) => `温度: ${context.raw.toFixed(1)}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: compact ? 'rgba(30, 51, 84, 0.2)' : 'rgba(30, 51, 84, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: { size: compact ? 8 : 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: compact ? 5 : 8,
          display: !compact,
        },
      },
      y: {
        min: 0,
        max: 12,
        grid: {
          color: compact ? 'rgba(30, 51, 84, 0.2)' : 'rgba(30, 51, 84, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: { size: compact ? 8 : 10 },
          callback: (value: any) => `${value}°C`,
          maxTicksLimit: compact ? 4 : 8,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default TempChart;
