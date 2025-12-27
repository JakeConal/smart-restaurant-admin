'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  padding?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  padding = 'p-8',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-200/50 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`relative bg-white w-full ${maxWidthClasses[maxWidth]} rounded-3xl shadow-2xl p-2 transform scale-100 transition-all border border-gray-100 max-h-[95vh] overflow-y-auto`}
      >
        <div className={`bg-gray-50 rounded-[1.25rem] ${padding} border border-gray-100`}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`flex justify-between items-start ${title ? 'mb-6' : 'mb-2'}`}>
              {title && <h3 className="text-2xl font-extrabold text-gray-900">{title}</h3>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          {children}
        </div>
      </div>
    </div>
  );
};
