'use client';

import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit';
}

/**
 * Glass-morphism button with hover effects
 * Adapted from /examples/jurigregg/main.css for dark theme
 */
export function GlassButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: GlassButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-emerald-600/80 to-emerald-500/80
      hover:from-emerald-500/90 hover:to-emerald-400/90
      text-white
      shadow-lg shadow-emerald-500/20
    `,
    secondary: `
      bg-gradient-to-r from-blue-600/80 to-cyan-500/80
      hover:from-blue-500/90 hover:to-cyan-400/90
      text-white
      shadow-lg shadow-blue-500/20
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative
        px-6 py-3
        rounded-full
        font-semibold
        text-sm
        tracking-wide
        uppercase
        backdrop-blur-sm
        border border-white/10
        transition-all duration-300 ease-out
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[0.98] active:scale-95'}
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
}
