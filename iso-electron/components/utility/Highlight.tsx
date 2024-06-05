import React from 'react';
import Highlight from 'react-highlight';
import 'highlight.js/styles/xt256.min.css';

const CodeHighlighter = ({
  language,
  code,
}: {
  language: string;
  code: string;
}) => {
  return <Highlight className={language}>{code}</Highlight>;
};

export default CodeHighlighter;
