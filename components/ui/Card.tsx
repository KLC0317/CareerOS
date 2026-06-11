import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`mb-4 flex items-center justify-between border-b border-slate-100 pb-3 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <h3 className={`text-sm font-bold text-slate-800 tracking-tight ${className}`}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`text-xs text-slate-600 leading-relaxed ${className}`}>{children}</div>;
};
