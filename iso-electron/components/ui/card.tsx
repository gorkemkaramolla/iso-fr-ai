import { Card } from 'primereact/card';

interface CardProps {
  children: React.ReactNode;
}

export default function CardComponent({ children }: CardProps) {
  return (
    <Card className='w-full bg-white rounded-lg shadow-xl overflow-hidden'>
      {children}
    </Card>
  );
}
