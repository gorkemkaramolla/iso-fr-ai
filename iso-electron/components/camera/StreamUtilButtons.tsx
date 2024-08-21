import React from 'react';
import { Ellipsis } from 'lucide-react';
import AddCameraButton from './AddCameraButton';
import { Toast } from 'primereact/toast';
import { DeleteDocumentIcon } from '../ui/DeleteIcon';
import { LuLayoutGrid } from "react-icons/lu";
import { BsLayoutSidebarReverse } from 'react-icons/bs';
import { PiResize } from "react-icons/pi";
interface StreamUtilButtonsProps {
  isModified: boolean;
  resetCameraStreams: () => void;
  deleteAllCameraStreams: () => void;
  setIsGrid: (value: boolean) => void;
  isGrid: boolean;
  cameraStreamsLength: number;
  toast: React.RefObject<Toast>;
}

const StreamUtilButtons: React.FC<StreamUtilButtonsProps> = ({
  isModified,
  resetCameraStreams,
  deleteAllCameraStreams,
  setIsGrid,
  isGrid,
  cameraStreamsLength,
  toast,
}) => {
  // if (cameraStreamsLength === 0) return null;

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <button tabIndex={0} className='btn btn-sm btn-ghost p-0 flex items-center'>
        <Ellipsis className='w-8 h-8' />
      </button>
      <ul
        tabIndex={0}
        className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 z-20'
      >
        <li>
          
          <AddCameraButton toast={toast} />
        </li>
        {isModified && (
          <li>
            <button
              onClick={resetCameraStreams}
              id='resetAllStreams'
              className='text-blue-600 hover:text-blue-700 flex items-center gap-2'
            >
              <PiResize className='w-6 h-6' />
              Düzeni Sıfırla
            </button>
          </li>
        )}
        {
          cameraStreamsLength > 1 && (
     <>
        <li>
          <button
            onClick={() => setIsGrid(!isGrid)}
            className='text-green-600 hover:text-green-700'
          >{isGrid ? (<BsLayoutSidebarReverse className='w-6 h-6'/>) : (<LuLayoutGrid className='w-6 h-6'/>)}
            {isGrid ? 'Serbest Düzen' : '2x2 Düzen'}
          </button>
        </li>
        <li>
          <button
            onClick={deleteAllCameraStreams}
            id='closeAllStreams'
            className='text-red-600 hover:text-red-700'
          >
            <DeleteDocumentIcon className='w-6 h-6' />
            Tüm Yayınları Kapat
          </button>
        </li>  </> )}
      </ul>
    </div>
  );
};

export default StreamUtilButtons;
