'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reusable glass card container with dark theme styling
 * Based on glass-morphism design from /examples/
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        bg-slate-800/50
        backdrop-blur-sm
        border border-slate-700/50
        rounded-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
}
