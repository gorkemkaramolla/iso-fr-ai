import React from 'react';
import { Card, CardBody, CardHeader, CardFooter } from '@nextui-org/react';

interface GlassyCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  shadow?: 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

const GlassyCard: React.FC<GlassyCardProps> = ({
  children,
  title,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  shadow = 'sm',
  hoverEffect = true,
}) => {
  return (
    <Card isBlurred className={` ${className}`} shadow={shadow}>
      {title && (
        <CardHeader className={`flex gap-3 ${headerClassName}`}>
          {title}
        </CardHeader>
      )}
      <CardBody className={`p-6 ${bodyClassName}`}>{children}</CardBody>
      {footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
    </Card>
  );
};

export default GlassyCard;
