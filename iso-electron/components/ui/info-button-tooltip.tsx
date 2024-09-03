import React from 'react';
import { BsInfoLg } from 'react-icons/bs';
import Tooltip from './tool-tip';

interface InfoTooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  placement = 'right',
}) => {
  return (
    <Tooltip placement={placement} content={content}>
      <button className='focus:outline-none'>
        <BsInfoLg className='mb-4 cursor-pointer' size={24} />
      </button>
    </Tooltip>
  );
};

export default InfoTooltip;
