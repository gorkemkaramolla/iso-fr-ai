import React from 'react';
import { Ellipsis} from 'lucide-react'
interface StreamUtilButtonsProps {
  isModified: boolean;
  resetCameraStreams: () => void;
  deleteAllCameraStreams: () => void;
  setIsGrid: (value: boolean) => void;
  isGrid: boolean;
  cameraStreamsLength: number;
}

const StreamUtilButtons: React.FC<StreamUtilButtonsProps> = ({
  isModified,
  resetCameraStreams,
  deleteAllCameraStreams,
  setIsGrid,
  isGrid,
  cameraStreamsLength,
}) => {
  if (cameraStreamsLength === 0) return null;

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <label tabIndex={0} className='btn btn-ghost'>
      <Ellipsis className='w-8 h-8' />
      </label>
      <ul tabIndex={0} className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52'>
        {isModified && (
          <li>
            <button onClick={resetCameraStreams} id='resetAllStreams' className='text-blue-600 hover:text-blue-700'>
              Düzeni Sıfırla
            </button>
          </li>
        )}
        <li>
          <button onClick={() => setIsGrid(!isGrid)} className='text-green-600 hover:text-green-700'>
            {isGrid ? 'Serbest Düzen' : '2x2 Düzen'}
          </button>
        </li>
        <li>
          <button onClick={deleteAllCameraStreams} id='closeAllStreams' className='text-red-600 hover:text-red-700'>
            Tüm Yayınları Kapat
          </button>
        </li>
      </ul>
    </div>
  );
};

export default StreamUtilButtons;
