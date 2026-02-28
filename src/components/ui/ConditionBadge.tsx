import React from 'react';
import styles from './Badge.module.css';

type Condition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';

interface ConditionBadgeProps {
  condition: Condition;
  className?: string;
}

const conditionLabels: Record<Condition, string> = {
  new: 'New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition, className }) => (
  <span
    className={`${styles.badge} ${className ?? ''}`}
    style={{
      backgroundColor: `var(--cond-${condition})`,
      color: '#fff',
    }}
  >
    {conditionLabels[condition]}
  </span>
);

export { ConditionBadge };
