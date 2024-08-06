import React, { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';

interface CalendarComponentProps {
  minDate: Date;
  selectedDate: Nullable<Date>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Nullable<Date>>>;
}

export default function CalendarComponent({
  minDate,
  selectedDate,
  setSelectedDate,
}: CalendarComponentProps) {
  return (
    <div className='card flex justify-content-center'>
      <Calendar
        className='w-40'
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.value)}
        minDate={minDate}
        maxDate={new Date()}
        readOnlyInput
        showIcon
        dateFormat='dd/mm/yy'
      />
    </div>
  );
}
