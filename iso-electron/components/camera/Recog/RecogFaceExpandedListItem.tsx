import React from 'react';
import RecogDetailsDialog from './RecogDetailsDialog';
import { formatLastSeen } from '@/library/camera/utils';
import { RecogFace } from '@/types';
interface RecogFaceExpandedListItemProps {
  face: RecogFace;
  index: number;
  selectedFace: RecogFace | null;
  setSelectedFace: React.Dispatch<React.SetStateAction<RecogFace | null>>;
}

const RecogFaceExpandedListItem: React.FC<RecogFaceExpandedListItemProps> = ({
  face,
  index,
  setSelectedFace,
  selectedFace,
}) => {
  const handleClick = () => {
    setSelectedFace(face);
    (
      document.getElementById(`modal-${index}`) as HTMLDialogElement
    )?.showModal();
  };

  return (
    <div className='m-1 w-16'>
      <img
        src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${face.image_path}`}
        alt={`Known Face ${index}`}
        className='object-cover w-[60px] h-[60px] rounded-sm cursor-pointer'
        onClick={handleClick}
      />
      <div className='text-xs text-balance font-light'>
        {formatLastSeen(face.timestamp)}
      </div>
      <RecogDetailsDialog index={index} selectedFace={selectedFace} />
    </div>
  );
};

export default RecogFaceExpandedListItem;
