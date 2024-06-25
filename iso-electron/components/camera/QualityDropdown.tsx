import React from 'react';
import { Quality } from '@/utils/enums';

interface QualityDropdownProps {
  id: number;
  selectedQuality: keyof typeof Quality;
  handleQualityChange: (id: number, quality: Quality) => void;
}

const QualityDropdown: React.FC<QualityDropdownProps> = ({
  id,
  selectedQuality,
  handleQualityChange,
}) => {
  return (
    <div className='dropdown'>
      <label tabIndex={0} className='btn btn-sm btn-outline '>
        {Quality[selectedQuality as keyof typeof Quality]}
      </label>
      <ul
        tabIndex={0}
        className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52'
      >
        {Object.keys(Quality).map((quality) => (
          <li key={quality}>
            <a onClick={() => handleQualityChange(id, quality as Quality)}>
              {Quality[quality as keyof typeof Quality]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QualityDropdown;
