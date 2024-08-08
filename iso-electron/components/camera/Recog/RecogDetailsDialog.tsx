import React from 'react';
import { XIcon } from 'lucide-react';
import RecogDetails from './RecogDetails';
import { RecogFace } from '@/types';

interface RecogDetailsDialogProps {
  index: number;
  selectedFace: RecogFace | null;
}

const RecogDetailsDialog: React.FC<RecogDetailsDialogProps> = ({
  index,
  selectedFace,
}) => {
  return (
    <dialog id={`modal-${index}`} className='modal'>
      <div className='modal-box max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden !p-0 !m-0'>
        <form method='dialog' className='absolute right-2 top-2'>
          <button className='btn btn-circle btn-ghost text-gray-500 hover:text-red-500 transition-colors duration-200 border-none'>
            <XIcon className='w-6 h-6 stroke-[3]' />
          </button>
        </form>
        {selectedFace && <RecogDetails selectedFace={selectedFace} />}
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button>close</button>
      </form>
    </dialog>
  );
};

export default RecogDetailsDialog;
