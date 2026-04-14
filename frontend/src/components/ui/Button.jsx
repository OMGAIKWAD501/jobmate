import React from 'react';
import { cn } from './utils';

const variantMap = {
  primary: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white border-transparent shadow-[0_10px_24px_rgba(37,99,235,0.28)] hover:scale-[1.03]',
  secondary: 'bg-white text-[#111827] border border-[#D1D5DB] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:scale-[1.03]',
  ghost: 'bg-transparent text-[#111827] border border-transparent hover:bg-[#F3F4F6] hover:scale-[1.03]'
};

const Button = ({ variant = 'primary', className = '', type = 'button', children, ...props }) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-60',
      variantMap[variant] || variantMap.primary,
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export default Button;
