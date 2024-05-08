import React from 'react';

interface Props {
  text: string;
  level: 'h1' | 'h2' | 'h3';
}

const Heading: React.FC<Props> = ({ text, level }) => {
  const Component = level;

  return (
    <article className='prose prose'>
      <Component>{text}</Component>
    </article>
  );
};

export default Heading;
