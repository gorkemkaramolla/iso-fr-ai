import React, { useEffect, useState, useRef } from 'react';
import { DatePicker, DateRangePicker, RangeValue } from '@nextui-org/react';
import { parseZonedDateTime, ZonedDateTime } from '@internationalized/date';
import {
  now,
  getLocalTimeZone,
  parseAbsoluteToLocal,
} from '@internationalized/date';

import { I18nProvider } from '@react-aria/i18n';
interface NextDateRangePickerProps {
  onDateRangeChange: (dateRange: { start: number; end: number }) => void;
  onDateChange?: (date: string) => void;
}

const NextDateRangePicker: React.FC<NextDateRangePickerProps> = ({
  onDateRangeChange,
  onDateChange,
}) => {
  const [dateRange, setDateRange] = useState<
    RangeValue<ZonedDateTime> | undefined
  >(undefined);
  const [selectedDate, setSelectedDate] = useState<ZonedDateTime | undefined>(
    undefined
  );
  const [isRange, setIsRange] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current && typeof window !== 'undefined') {
      const storedDateRange = localStorage.getItem('dateRange');
      if (storedDateRange) {
        const parsedDateRange = JSON.parse(storedDateRange);

        const startIsoString = new Date(parsedDateRange.start)
          .toISOString()
          .replace('Z', '[UTC]');
        const endIsoString = new Date(parsedDateRange.end)
          .toISOString()
          .replace('Z', '[UTC]');

        setDateRange({
          start: parseZonedDateTime(startIsoString),
          end: parseZonedDateTime(endIsoString),
        });

        onDateRangeChange({
          start: parsedDateRange.start,
          end: parsedDateRange.end,
        });
      } else {
        const defaultStart = parseZonedDateTime(
          '2024-04-01T00:45[America/Los_Angeles]'
        );
        const defaultEnd = parseZonedDateTime(
          '2024-04-08T11:15[America/Los_Angeles]'
        );
        setDateRange({ start: defaultStart, end: defaultEnd });
      }
      hasMounted.current = true;
    }
  }, [onDateRangeChange]);

  function handleDateRangeChange(value: RangeValue<ZonedDateTime>) {
    if (value.start && value.end) {
      setDateRange(value);

      if (typeof window !== 'undefined') {
        const dateRange = {
          start: value.start.toDate().getTime(),
          end: value.end.toDate().getTime(),
        };
        localStorage.setItem('dateRange', JSON.stringify(dateRange));
        onDateRangeChange(dateRange);
      }
    }
  }

  function handleSingleDateChange(value: ZonedDateTime | null) {
    if (value) {
      setSelectedDate(value);

      if (typeof window !== 'undefined') {
        const date = value.toDate().getTime();
        localStorage.setItem('selectedDate', JSON.stringify(date));
        if (onDateChange) {
          onDateChange(date.toString());
        }
      }
    }
  }

  return (
    <div className='w-full max-w-xl  flex flex-col-reverse gap-1'>
      <I18nProvider locale='tr-TR'>
        {!isRange ? (
          <DatePicker
            size='sm'
            hideTimeZone
            hourCycle={24}
            showMonthAndYearPickers
            granularity='day' // This restricts the picker to only allow date selection
            defaultValue={now(getLocalTimeZone())}
            value={selectedDate}
            onChange={handleSingleDateChange}
          />
        ) : (
          <DateRangePicker
            size='sm'
            hideTimeZone
            hourCycle={24}
            visibleMonths={2}
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        )}
      </I18nProvider>
      <span
        onClick={() => setIsRange(!isRange)}
        className='text-[11px] hover:underline cursor-pointer '
      >
        {isRange ? 'Tarih Seçin' : 'Tarih Aralığı Seçin'}
      </span>
    </div>
  );
};

export default NextDateRangePicker;
