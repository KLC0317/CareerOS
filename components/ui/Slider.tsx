import React from 'react';

export const Slider = ({
  min,
  max,
  value,
  onChange,
  className = ''
}: {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none ${className}`}
    />
  );
};
