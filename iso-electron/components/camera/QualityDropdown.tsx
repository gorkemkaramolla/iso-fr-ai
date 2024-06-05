import React from 'react';
import { Quality } from '@/utils/enums';

interface QualityDropdownProps {
  id: number;
  selectedQuality: Quality;
  handleQualityChange: (id: number, quality: Quality) => void;
}

const QualityDropdown: React.FC<QualityDropdownProps> = ({
  id,
  selectedQuality,
  handleQualityChange,
}) => {
  return (
    <div>
      <select
        value={String(selectedQuality)}
        onChange={(e) => handleQualityChange(id, e.target.value as Quality)}
        className='select select-bordered w-full max-w-xs select-sm'
      >
        <option disabled value='' className='select-option'>
          Çözünürlük
        </option>
        {Object.keys(Quality).map((quality) => (
          <option className='select-option' key={quality} value={quality}>
            {Quality[quality as keyof typeof Quality]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default QualityDropdown;
