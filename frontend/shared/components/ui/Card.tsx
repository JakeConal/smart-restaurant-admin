import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'vip';
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  hover = true,
}) => {
  const baseClasses = `rounded-[1.75rem] border transition-all duration-300 ${
    onClick ? 'cursor-pointer' : ''
  }`;

  const variants = {
    default: `bg-white border-slate-200/10 shadow-md ${
      hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005]' : ''
    }`,
    dark: `bg-slate-800 text-white border-none shadow-md ${
      hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005]' : ''
    }`,
    vip: `bg-white border-slate-200/10 shadow-md ring-4 ring-orange-50/50 ${
      hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005]' : ''
    }`,
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
