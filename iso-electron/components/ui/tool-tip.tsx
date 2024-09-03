import React from 'react';
import { Tooltip as NextUITooltip } from '@nextui-org/react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return <NextUITooltip content={content}>{children}</NextUITooltip>;
};

export default Tooltip;
