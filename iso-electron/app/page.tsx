'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ChartData, ChartOptions } from 'chart.js';

interface DetectionData {
  recognized: number;
  unrecognized: number;
  total: number;
}

interface PersonDetection {
  name: string;
  count: number;
  lastSeen: string;
}

interface PeriodOption {
  label: string;
  value: string;
}

const SecurityDashboard: React.FC = () => {
  const [detectionData, setDetectionData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [timeSeriesData, setTimeSeriesData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [topDetections, setTopDetections] = useState<PersonDetection[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('lastDay');

  const periodOptions: PeriodOption[] = [
    { label: 'Last 24 Hours', value: 'lastDay' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  useEffect(() => {
    fetchData(periodFilter, dateFilter);
  }, [periodFilter, dateFilter]);

  const fetchData = (period: string, date: Date | null) => {
    // Simulated API calls
    setDetectionData({
      labels: ['Recognized', 'Unrecognized'],
      datasets: [
        {
          data: [85, 15],
          backgroundColor: ['#36A2EB', '#FF6384'],
          hoverBackgroundColor: ['#36A2EB', '#FF6384'],
        },
      ],
    });

    setTimeSeriesData({
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          label: 'Detections',
          data: [12, 5, 25, 30, 40, 35],
          fill: false,
          borderColor: '#4BC0C0',
          tension: 0.4,
        },
      ],
    });

    setTopDetections([
      { name: 'John Doe', count: 15, lastSeen: '2024-08-13 14:30' },
      { name: 'Jane Smith', count: 12, lastSeen: '2024-08-13 13:45' },
      { name: 'Bob Johnson', count: 10, lastSeen: '2024-08-13 12:15' },
      { name: 'Alice Brown', count: 8, lastSeen: '2024-08-13 11:30' },
      { name: 'Charlie Wilson', count: 7, lastSeen: '2024-08-13 10:00' },
    ]);
  };

  const chartOptions: ChartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-8'>
      <h1 className='text-4xl font-bold mb-12 text-center text-gray-800'>
        Security Camera Analytics
      </h1>

      <div className='flex justify-center mb-12 space-x-4'>
        <Dropdown
          value={periodFilter}
          options={periodOptions}
          onChange={(e: DropdownChangeEvent) => setPeriodFilter(e.value)}
          placeholder='Select Period'
          className='w-48'
        />
        <Calendar
          value={dateFilter}
          onChange={(e: any) => setDateFilter(e.value as Date)}
          showIcon
          placeholder='Select Date'
          className='w-48'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        <Card title='Face Detection Overview' className='shadow-xl rounded-lg'>
          <div className='h-64'>
            <Chart type='pie' data={detectionData} options={chartOptions} />
          </div>
        </Card>

        <Card title='Detections Over Time' className='shadow-xl rounded-lg'>
          <div className='h-64'>
            <Chart type='line' data={timeSeriesData} options={chartOptions} />
          </div>
        </Card>

        <Card title='Top Detected Individuals' className='shadow-xl rounded-lg'>
          <DataTable value={topDetections} className='p-datatable-sm'>
            <Column field='name' header='Name' />
            <Column field='count' header='Count' />
            <Column field='lastSeen' header='Last Seen' />
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default SecurityDashboard;
