import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  /* Compute menu position from trigger button */
  const updateMenuPos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom, left: rect.left });
    }
  }, []);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  /* Close dropdown on route change */
  useEffect(() => {
    setDropdownOpen(false);
  }, [location]);

  const isNfaActive =
    (location.pathname === '/firearms' && location.search === '?category=nfa_firearm') ||
    location.pathname === '/suppressors';

  const handleToggle = () => {
    if (!dropdownOpen) updateMenuPos();
    setDropdownOpen((o) => !o);
  };

  /* Dropdown menu rendered via portal to avoid overflow clipping */
  const dropdownMenu = dropdownOpen
    ? createPortal(
        <div
          ref={menuRef}
          className={styles.menu}
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {(TABS.find((t) => isDropdown(t)) as DropdownTab)?.children.map(
            (child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
                }
              >
                {child.label}
              </NavLink>
            ),
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map((tab) => {
          if (isDropdown(tab)) {
            return (
              <div key={tab.label} className={styles.dropdown}>
                <button
                  ref={triggerRef}
                  type="button"
                  className={`${styles.tab} ${isNfaActive ? styles.active : ''}`}
                  onClick={handleToggle}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {tab.label}
                  <span className={styles.caret} aria-hidden="true">
                    &#9662;
                  </span>
                </button>
              </div>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/ammunition' || tab.to === '/trust-documents'}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.active : ''}`
              }
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>
      {dropdownMenu}
    </nav>
  );
};

export { CategoryNav };
