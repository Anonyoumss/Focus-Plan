import React from 'react';

interface MaterialIconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  filled = false,
  className = '',
  size = 24,
  ariaLabel,
}) => {
  return (
    <span
      className={`material-symbols-rounded ${filled ? 'filled' : ''} ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: 'middle',
      }}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {name}
    </span>
  );
};
