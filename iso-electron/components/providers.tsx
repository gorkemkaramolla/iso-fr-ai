import { isAuthenticated } from '@/library/auth/is_authenticated';
import React, { ReactNode } from 'react';
import NavigationBar from './ui/NavigationBar';

interface ProviderProps {}

const Provider: React.FC<ProviderProps> = ({}) => {
  const logged_in = isAuthenticated();
  return <>{logged_in && <NavigationBar />}</>;
};

export default Provider;
