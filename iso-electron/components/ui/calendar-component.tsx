import React, { useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';

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
      if (savedDate) {
        const parsedDate = new Date(savedDate);
        if (isDateAvailable(parsedDate)) {
          setSelectedDate(parsedDate);
        }
      }
    }
  }, [localStorageSaveName]);

  const isDateAvailable = (date: Date) =>
    availableDates.some(
      (availableDate) => availableDate.toDateString() === date.toDateString()
    );

  const handleDateChange = (e: any) => {
    const date = e.value;
    setSelectedDate(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageSaveName, date.toISOString());
    }
  };

  return (
    <div className='flex justify-content-center'>
      <Calendar
        className='' // Make the calendar look like a small button
        value={selectedDate}
        onChange={handleDateChange}
        minDate={availableDates[0]} // Set the earliest available date
        maxDate={availableDates[availableDates.length - 1]} // Set the latest available date
        readOnlyInput
        showIcon
        dateFormat='dd/mm/yy'
        disabledDates={availableDates.filter((date) => !isDateAvailable(date))} // Disable unavailable dates
      />
    </div>
  );
}
