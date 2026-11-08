import React from 'react';
import { ICON_CODEPOINTS } from '../../lib/iconCodepoints';

interface MaterialIconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  filled = false,
  className = '',
  size = 24,
  ariaLabel,
  style,
}) => {
  return (
    <span
      className={`material-symbols-rounded ${filled ? 'filled' : ''} ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: 'middle',
        ...style,
      }}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {ICON_CODEPOINTS[name] !== undefined
        ? String.fromCodePoint(ICON_CODEPOINTS[name])
        : name}
    </span>
  );
};
