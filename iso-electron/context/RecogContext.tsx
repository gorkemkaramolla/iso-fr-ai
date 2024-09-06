'use client';
import { RecogFace } from '@/types';
import React from 'react';

export const RecogContext = React.createContext<RecogFace[] | undefined>([]);
