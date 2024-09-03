import React from 'react';
import { Progress } from '@nextui-org/react';

interface ProgressProps {
  current: number;
}

export default function App({ current }: ProgressProps) {
  return <Progress size='sm' aria-label='Loading...' value={current} />;
}
