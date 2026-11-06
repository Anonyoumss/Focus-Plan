import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'w-12 h-12 rounded-full';
      case 'card':
        return 'w-full h-32 rounded-2xl';
      case 'text':
      default:
        return 'w-full h-4 rounded-md';
    }
  };

  return (
    <div className="space-y-2.5 animate-pulse" aria-hidden="true">
      {items.map((_, i) => (
        <div
          key={i}
          className={`${getVariantStyles()} ${className}`}
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
};
