import React, { useEffect, useState, useRef } from 'react';
import { DatePicker, DateRangePicker, RangeValue } from '@nextui-org/react';
import { parseZonedDateTime, ZonedDateTime } from '@internationalized/date';
import { now, getLocalTimeZone } from '@internationalized/date';

interface NextDateRangePickerProps {
  onDateRangeChange: (dateRange: { start: string; end: string }) => void;
}

const NextDateRangePicker: React.FC<NextDateRangePickerProps> = ({
  onDateRangeChange,
}) => {
  const [dateRange, setDateRange] = useState<
    RangeValue<ZonedDateTime> | undefined
  >(undefined);
  const [isRange, setIsRange] = useState(false);

  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current && typeof window !== 'undefined') {
      const storedDateRange = localStorage.getItem('dateRange');
      if (storedDateRange) {
        const parsedDateRange = JSON.parse(storedDateRange);
        setDateRange({
          start: parseZonedDateTime(parsedDateRange.start),
          end: parseZonedDateTime(parsedDateRange.end),
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

  function handleDateChange(value: RangeValue<ZonedDateTime>) {
    if (value.start && value.end) {
      setDateRange(value);

      if (typeof window !== 'undefined') {
        const dateRange = {
          start: value.start.toString(),
          end: value.end.toString(),
        };
        localStorage.setItem('dateRange', JSON.stringify(dateRange));
        onDateRangeChange(dateRange);
      }
    }
  }

  return (
    <div className='w-full max-w-xl flex flex-col-reverse gap-4'>
      {!isRange ? (
        <DatePicker
          label='Tarih seç'
          hideTimeZone
          hourCycle={24}
          showMonthAndYearPickers
          defaultValue={now(getLocalTimeZone())}
        />
      ) : (
        <DateRangePicker
          label='Belirli bir tarih aralığında arayın'
          hideTimeZone
          hourCycle={24}
          visibleMonths={2}
          value={dateRange}
          onChange={handleDateChange}
        />
      )}
      <span
        onClick={() => setIsRange(!isRange)}
        className='text-[11px] hover:underline cursor-pointer w-1/4'
      >
        {isRange ? 'Tarih Seçin' : 'Tarih Aralığı Seçin'}
      </span>
    </div>
  );
};

export default NextDateRangePicker;
