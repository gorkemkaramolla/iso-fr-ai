import { RefObject, useCallback, useEffect, useState } from 'react';

type UseResize = {
  width: number;
  height: number;
};

const useResize = (myRef: RefObject<HTMLElement>): UseResize => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const handleResize = useCallback(() => {
    if (myRef.current) {
      setWidth(myRef.current.offsetWidth);
      setHeight(myRef.current.offsetHeight);
    }
  }, [myRef]);

  useEffect(() => {
    handleResize(); // Set initial size

    const observer = new ResizeObserver(handleResize);
    if (myRef.current) {
      observer.observe(myRef.current);
    }

    return () => {
      if (myRef.current) {
        observer.unobserve(myRef.current);
      }
    };
  }, [myRef, handleResize]);

  return { width, height };
};

export { useResize };
