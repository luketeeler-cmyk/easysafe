import React from 'react';
import styles from './SubTabNav.module.css';

interface SubTabNavProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const SubTabNav: React.FC<SubTabNavProps> = ({ tabs, activeTab, onTabChange }) => (
  <nav className={styles.wrapper} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        role="tab"
        aria-selected={tab.key === activeTab}
        className={`${styles.tab} ${tab.key === activeTab ? styles.active : ''}`}
        onClick={() => onTabChange(tab.key)}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </nav>
);

export { SubTabNav };
