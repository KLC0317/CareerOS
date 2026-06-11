import React from 'react';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const base = 'px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-250 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-sm active:scale-[0.98]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm active:scale-[0.98]',
    ghost: 'hover:bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-[0.98]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
