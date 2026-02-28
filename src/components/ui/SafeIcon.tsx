import React from 'react';

interface SafeIconProps {
  size?: number;
  className?: string;
}

const SafeIcon: React.FC<SafeIconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Outer frame */}
    <rect x="2" y="2" width="20" height="20" rx="2" />
    {/* Inner panel */}
    <rect x="5" y="5" width="14" height="14" rx="1" />
    {/* Dial circle */}
    <circle cx="12" cy="12" r="4" />
    {/* Tick marks — top, right, bottom, left */}
    <line x1="12" y1="8" x2="12" y2="9.5" />
    <line x1="16" y1="12" x2="14.5" y2="12" />
    <line x1="12" y1="16" x2="12" y2="14.5" />
    <line x1="8" y1="12" x2="9.5" y2="12" />
    {/* Handle bar */}
    <line x1="18" y1="10" x2="18" y2="14" strokeWidth="2" />
    {/* Hinge dots */}
    <circle cx="4" cy="6" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export { SafeIcon };
