import React from 'react';
import { Avatar, AvatarGroup, AvatarIcon } from '@nextui-org/react';
import { GroupedRecogFaces } from '@/types';

interface RecogFaceCollapsedItemProps {
  groups: GroupedRecogFaces[];
  handleImageClick: (name: string) => void;
}

const RecogFacesAvatarGroup: React.FC<RecogFaceCollapsedItemProps> = ({
  groups,
  handleImageClick,
}) => {
  return (
    <AvatarGroup isBordered max={10}>
      {groups.map((group, index) => (
        <Avatar
          key={index}
          src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${group.personnel_id}`}
          classNames={{
            base: 'bg-gradient-to-br from-[#FFB457] to-[#FF705B]',
            icon: 'text-black/80',
            fallback: 'w-10 h-10',
          }}
          style={{ fontSize: '1.5rem' }}
          onClick={() => handleImageClick(group.personnel_id)}
          title={`${group.name}`}
          showFallback
          fallback={<AvatarIcon />}
        />
      ))}
    </AvatarGroup>
  );
};

export default RecogFacesAvatarGroup;
