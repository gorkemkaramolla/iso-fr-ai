import React from 'react';
import { useRouter } from 'next/navigation';
import { XIcon, SearchIcon } from 'lucide-react';
import Calendar from '../Calendar'; // Assuming you have a Calendar component
import { Nullable } from 'primereact/ts-helpers';

interface RecogFaceHeaderBarProps {
  selectedDate: Nullable<Date>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Nullable<Date>>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const RecogFaceHeaderBar: React.FC<RecogFaceHeaderBarProps> = ({
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
}) => {
  const router = useRouter();

  return (
    <>
      <div className='flex items-center justify-between gap-2 mb-2'>
        <h1
          className='text-3xl font-bold cursor-pointer'
          onClick={() => router.push('/recog')}
        >
          Tanınan Yüzler
        </h1>
        <div>
          <Calendar
            minDate={new Date('Aug 01, 2024')}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </div>
      <label className='input input-bordered flex items-center gap-2 mb-2'>
        <input
          type='text'
          className='grow'
          placeholder='İsim Ara...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <XIcon
            onClick={() => setSearchQuery('')}
            className='text-red-600 cursor-pointer active:scale-75 transition-transform duration-200'
          />
        )}
        <div
          className={`${searchQuery ? 'hidden' : 'tooltip tooltip-left'}`}
          data-tip='İsime göre arama yapınız.'
        >
          <SearchIcon className={`opacity-70 ${searchQuery ? 'hidden' : ''}`} />
        </div>
      </label>
    </>
  );
};

export default RecogFaceHeaderBar;
