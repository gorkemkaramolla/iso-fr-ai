import React from 'react';
import { Tooltip as NextUITooltip, TooltipPlacement } from '@nextui-org/react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  showTitle?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'right',
  showTitle = true,
}) => {
  return (
    <NextUITooltip
      placement={placement}
      size='sm'
      content={
        <div
          style={{
            maxWidth: '200px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {showTitle && (
            <div className='flex gap-1 items-center mb-1'>
              <span className='font-semibold'>Bilgilendirme</span>
              <Info size={16} className='mr-1' />
            </div>
          )}
          {content}
        </div>
      }
    >
      {children}
    </NextUITooltip>
  );
};

export default Tooltip;
