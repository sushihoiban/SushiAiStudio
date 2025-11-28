import React, { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  startIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, startIcon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-medium text-neutral-400">{label}</label>}
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          className={`flex h-10 w-full rounded-md border border-dark-700 bg-dark-900/50 px-3 py-2 text-sm text-neutral-100 ring-offset-dark-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${startIcon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};