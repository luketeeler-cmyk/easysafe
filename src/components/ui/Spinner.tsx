import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number;
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 20, color }) => {
  const borderWidth = Math.max(2, Math.round(size / 10));

  return (
    <span
      className={styles.spinner}
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        borderWidth,
        borderTopColor: color ?? 'var(--od)',
      }}
    />
  );
};

export { Spinner };
