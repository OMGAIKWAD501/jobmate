import React from 'react';
import Card from './Card';

const EmptyState = ({ title, description }) => (
  <Card className="text-center">
    <h3 className="mb-2 text-lg font-semibold text-[#111827]">{title}</h3>
    <p className="text-sm text-[#6B7280]">{description}</p>
  </Card>
);

export default EmptyState;
