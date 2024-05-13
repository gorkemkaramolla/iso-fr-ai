import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

const SpeechLayout: React.FC<Props> = ({ children }) => {
  return <div className=''>{children}</div>;
};

export default SpeechLayout;
