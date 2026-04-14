import React from 'react';
import { cn } from './utils';

const Input = ({ className = '', ...props }) => (
  <input
    className={cn(
      'w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition duration-200 ease-in-out focus:border-[#2563EB] focus:ring-4 focus:ring-[#DBEAFE]',
      className
    )}
    {...props}
  />
);

export default Input;
