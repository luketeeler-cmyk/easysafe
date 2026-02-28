import React from 'react';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  stats: { label: string; value: string | number }[];
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => (
  <div className={styles.wrapper}>
    {stats.map((stat) => (
      <div key={stat.label} className={styles.item}>
        <span className={styles.label}>{stat.label}</span>
        <span className={styles.value}>{stat.value}</span>
      </div>
    ))}
  </div>
);

export { StatsBar };
