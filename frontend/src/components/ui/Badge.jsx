import React from 'react';
import { cn } from './utils';

const toneMap = {
  neutral: 'bg-[#F3F4F6] text-[#374151]',
  info: 'bg-[#DBEAFE] text-[#1D4ED8]',
  success: 'bg-[#DCFCE7] text-[#15803D]',
  warning: 'bg-[#FFEDD5] text-[#C2410C]'
};

const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', toneMap[tone] || toneMap.neutral, className)}>
    {children}
  </span>
);

export default Badge;
