import React from 'react';
import { cn } from './utils';

const Skeleton = ({ className = '' }) => (
  <div className={cn('animate-pulse rounded-xl bg-[#E5E7EB]', className)} />
);

export default Skeleton;
