import React, { useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';
import { Button } from 'primereact/button';

interface CalendarComponentProps {
  availableDates: Date[];
  selectedDate: Nullable<Date>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Nullable<Date>>>;
  localStorageSaveName: string;
}

export default function CalendarComponent({
  availableDates,
  selectedDate,
  setSelectedDate,
  localStorageSaveName,
}: CalendarComponentProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem(localStorageSaveName);
      if (savedDate === 'null') {
        setSelectedDate(null);
      } else if (savedDate) {
        const parsedDate = new Date(savedDate);
        if (isDateAvailable(parsedDate)) {
          setSelectedDate(parsedDate);
        }
      }
    }
  }, [localStorageSaveName, setSelectedDate]);

  const isDateAvailable = (date: Date) =>
    availableDates.some(
      (availableDate) => availableDate.toDateString() === date.toDateString()
    );

  const handleDateChange = (e: any) => {
    const date = e.value;
    setSelectedDate(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        localStorageSaveName,
        date ? date.toISOString() : 'null'
      );
    }
  };

  const handleShowAll = () => {
    setSelectedDate(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageSaveName, 'null');
    }
  };

  return (
    <div className='flex items-center justify-content-center p-0'>
      <Button
        className='text-sm bg-primary disabled:bg-primary-900 rounded-r-none'
        onClick={handleShowAll}
        disabled={!selectedDate}
        icon={'pi pi-calendar-times'}
      />
      <Calendar
        variant='filled'
        className='  [&_.p-datepicker-trigger]:bg-primary w-full   p-0 m-0 rounded-none!'
        value={selectedDate}
        onChange={handleDateChange}
        minDate={availableDates[0]}
        maxDate={availableDates[availableDates.length - 1]}
        readOnlyInput
        showIcon
        dateFormat='dd/mm/yy'
        disabledDates={availableDates.filter((date) => !isDateAvailable(date))}
      />
    </div>
  );
}
