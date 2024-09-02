'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ChartData, ChartOptions } from 'chart.js';
import { getRecogFaces } from '@/services/camera/service';
import { RecogFace } from '@/types';

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
  const [recogList, setRecogList] = useState<RecogFace[]>([]);

  const periodOptions: PeriodOption[] = [
    { label: 'Son 24 Saat', value: 'lastDay' },
    { label: 'Son Hafta', value: 'lastWeek' },
    { label: 'Son Ay', value: 'lastMonth' },
  ];

  useEffect(() => {
    const storedDate = localStorage.getItem('homepageDate');
    const initialDate = storedDate ? new Date(storedDate) : new Date();
    setDateFilter(initialDate);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRecogFaces(dateFilter?.toISOString());
      setRecogList(data);
      console.log(data);
    };
    if (dateFilter) {
      fetchData();
    }
  }, [dateFilter]);

  useEffect(() => {
    if (dateFilter && recogList.length > 0) {
      fetchData(periodFilter, dateFilter);
    }
  }, [periodFilter, dateFilter, recogList]);

  const handleDateChange = (e: any) => {
    const newDate = e.value as Date;
    setDateFilter(newDate);
    localStorage.setItem('homepageDate', newDate.toISOString());
  };

  const fetchData = (period: string, date: Date | null) => {
    setDetectionData({
      labels: ['Recognized', 'Unrecognized'],
      datasets: [
        {
          data: [recogList.length, 0],
          backgroundColor: ['#36A2EB', '#FF6384'],
          hoverBackgroundColor: ['#36A2EB', '#FF6384'],
        },
      ],
    });

    // Process recogList for time series data
    const timeData = processTimeSeriesData(recogList);
    setTimeSeriesData({
      labels: timeData.labels,
      datasets: [
        {
          label: 'Detections',
          data: timeData.data,
          fill: false,
          borderColor: '#4BC0C0',
          tension: 0.4,
        },
      ],
    });
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('tr-TR');
    };

    const topDetections = Object.values(
      recogList.reduce((acc, recog) => {
        const name = recog.label || 'Unknown';
        if (!acc[name]) {
          acc[name] = {
            name,
            count: 0,
            lastSeen: formatDate(Number(recog.timestamp)),
          };
        }
        acc[name].count++;
        const currentTimestamp = Number(recog.timestamp);
        const storedTimestamp = new Date(acc[name].lastSeen).getTime();
        acc[name].lastSeen =
          storedTimestamp > currentTimestamp
            ? acc[name].lastSeen
            : formatDate(currentTimestamp);
        return acc;
      }, {} as Record<string, PersonDetection>)
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setTopDetections(topDetections);
  };

  const processTimeSeriesData = (data: RecogFace[]) => {
    const hourCounts: { [key: string]: number } = {};
    data.forEach((face) => {
      const hour = new Date(face.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
    });

    const sortedHours = Object.keys(hourCounts).sort();
    return {
      labels: sortedHours,
      data: sortedHours.map((hour) => hourCounts[hour]),
    };
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
        Güvenlik Kamera İstatistikleri
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
          onChange={handleDateChange}
          showIcon
          placeholder='Select Date'
          className='w-48'
          maxDate={new Date()}
          dateFormat='dd/mm/yy'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        <Card
          title='Yüz Tanıma İstatistikleri'
          className='shadow-xl rounded-lg'
        >
          <div className='h-64'>
            <Chart type='pie' data={detectionData} options={chartOptions} />
          </div>
        </Card>

        <Card
          title='Zaman Serisi İstatistikleri'
          className='shadow-xl rounded-lg'
        >
          <div className='h-64'>
            <Chart type='line' data={timeSeriesData} options={chartOptions} />
          </div>
        </Card>

        <Card title='En Çok Tanınan Kişiler' className='shadow-xl rounded-lg'>
          <DataTable value={topDetections} className='p-datatable-sm'>
            <Column field='name' header='Kişi' />
            <Column field='count' header='Sayı' />
            <Column field='lastSeen' header='Son Görülme Tarihi' />
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default SecurityDashboard;
