import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'rounded-xl font-bold transition-all inline-flex items-center justify-center gap-2';

    const variants = {
      primary:
        'bg-slate-700 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-800 shadow-md hover:shadow-lg hover:-translate-y-px active:scale-[0.98]',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    };

    const sizes = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3.5 text-base',
    };

    const disabledClasses = 'opacity-60 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-500';

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
          isDisabled ? disabledClasses : ''
        } ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
