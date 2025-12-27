import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border ${
            error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-400'
          } rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none transition-all ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-400 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
