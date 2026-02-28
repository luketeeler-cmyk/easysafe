import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './CategoryNav.module.css';

interface NavTab {
  label: string;
  to: string;
}

interface DropdownTab {
  label: string;
  children: NavTab[];
}

type TabItem = NavTab | DropdownTab;

function isDropdown(item: TabItem): item is DropdownTab {
  return 'children' in item;
}

const TABS: TabItem[] = [
  { label: 'Ammunition', to: '/ammunition' },
  {
    label: 'NFA',
    children: [
      { label: 'NFA Firearms', to: '/firearms?category=nfa_firearm' },
      { label: 'Suppressors', to: '/suppressors' },
    ],
  },
  { label: 'Handguns', to: '/firearms?category=handgun' },
  { label: 'Rifles', to: '/firearms?category=rifle' },
  { label: 'Shotguns', to: '/firearms?category=shotgun' },
  { label: 'Trust Documents', to: '/trust-documents' },
];

const CategoryNav: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Close dropdown on route change */
  useEffect(() => {
    setDropdownOpen(false);
  }, [location]);

  const isNfaActive =
    location.pathname + location.search === '/firearms?category=nfa_firearm' ||
    location.pathname === '/suppressors';

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map((tab) => {
          if (isDropdown(tab)) {
            return (
              <div
                key={tab.label}
                className={styles.dropdown}
                ref={dropdownRef}
              >
                <button
                  type="button"
                  className={`${styles.tab} ${isNfaActive ? styles.active : ''}`}
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {tab.label}
                  <span className={styles.caret} aria-hidden="true">
                    &#9662;
                  </span>
                </button>
                {dropdownOpen && (
                  <div className={styles.menu}>
                    {tab.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.active : ''}`
              }
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export { CategoryNav };
