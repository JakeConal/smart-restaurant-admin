import React from 'react';

export interface BadgeProps {
  variant?: 'active' | 'inactive' | 'vip' | 'system';
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'active', children, className = '', onClick }) => {
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide inline-block transition-all';

  const variants = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-gray-500',
    vip: 'bg-orange-100 text-orange-700',
    system: 'bg-white/10 text-white',
  };

  const clickableClasses = onClick ? 'cursor-pointer hover:brightness-95 active:scale-95 select-none' : '';

  return (
    <span 
      className={`${baseClasses} ${variants[variant]} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
};
