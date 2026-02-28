import React from 'react';
import styles from './FilterTabs.module.css';

interface FilterTabsProps {
  options: { value: string; label: string }[];
  activeValue: string;
  onChange: (value: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ options, activeValue, onChange }) => (
  <div className={styles.wrapper} role="tablist">
    {options.map((opt) => (
      <button
        key={opt.value}
        role="tab"
        aria-selected={opt.value === activeValue}
        className={`${styles.pill} ${opt.value === activeValue ? styles.active : ''}`}
        onClick={() => onChange(opt.value)}
        type="button"
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export { FilterTabs };
