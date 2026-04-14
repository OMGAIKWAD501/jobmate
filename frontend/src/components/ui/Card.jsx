import React from 'react';
import { cn } from './utils';

const Card = ({ className = '', children, hoverable = false }) => (
  <div
    className={cn(
      'rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition duration-200 ease-in-out',
      hoverable ? 'hover:scale-[1.03]' : '',
      className
    )}
  >
    {children}
  </div>
);

export default Card;
