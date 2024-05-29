import React from 'react';
import { Quality } from '@/utils/enums';

interface QualityDropdownProps {
  selectedQuality: Quality;
  onQualityChange: (selectedQuality: Quality) => void;
}

const QualityDropdown: React.FC<QualityDropdownProps> = ({
  selectedQuality,
  onQualityChange,
}) => {
  return (
    <div>
      <select
        value={String(selectedQuality)}
        onChange={(e) => onQualityChange(e.target.value as Quality)}
        className='select select-bordered w-full max-w-xs select-sm '
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
