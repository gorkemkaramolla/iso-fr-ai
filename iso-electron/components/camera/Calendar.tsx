import React, { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';

interface CalendarComponentProps {
  minDate: Date;
  selectedDate: Nullable<Date>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Nullable<Date>>>;
  className?: string;
}

export default function CalendarComponent({
  minDate,
  selectedDate,
  setSelectedDate,
  className,
}: CalendarComponentProps) {
  return (
    <div className='card flex justify-content-center'>
      <Calendar
        className={'w-44' + (className ? ` ${className}` : '')}
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
