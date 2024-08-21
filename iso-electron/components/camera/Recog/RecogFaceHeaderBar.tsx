import React from 'react';
import { useRouter } from 'next/navigation';
import { XIcon, SearchIcon } from 'lucide-react';
import Calendar from '../Calendar'; // Assuming you have a Calendar component
import { Nullable } from 'primereact/ts-helpers';
import { Input } from '@nextui-org/react';

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
          className='text-2xl cursor-pointer nunito-700 text-gray-700'
          onClick={() => router.push('/recog')}
        >
          Tanınan Yüzler
        </h1>

        {/* <div>
          <Calendar
           className='h-10'
            minDate={new Date('Aug 01, 2024')}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div> */}
      </div>
    <div className='mb-2'>

        <Input
          isClearable
          onClear={() => setSearchQuery('')}
          type='text'
          className='grow'
          placeholder='İsim Ara...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          
          />
          </div>

    </>
  );
};

export default RecogFaceHeaderBar;
