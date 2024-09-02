import React from 'react';
import RecogDetailsDialog from './RecogDetailsDialog';
import { formatLastSeen } from '@/library/camera/utils';
import { RecogFace } from '@/types';
import Image from 'next/image';
import { useDisclosure } from '@nextui-org/react';
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const handleClick = () => {
    setSelectedFace(face);
    onOpen();
  };

  return (
    <div className='m-1 w-16'>
      <Image
        src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${face.image_path}`}
        alt={`Known Face ${index}`}
        width={60}
        height={60}
        className='object-cover w-[60px] h-[60px] rounded-md cursor-pointer'
        onClick={handleClick}
      />
      <div className='text-xs text-balance font-light'>
        {formatLastSeen(face.timestamp)}
      </div>
      <RecogDetailsDialog
        selectedFace={selectedFace}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    </div>
  );
};

export default RecogFaceExpandedListItem;
