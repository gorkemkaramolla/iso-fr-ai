import React from 'react';

interface Props {
  params: {
    id: string;
  };
}

const Transcriptions: React.FC<Props> = ({ params: { id } }) => {
  return <div>{id}</div>;
};

export default Transcriptions;
