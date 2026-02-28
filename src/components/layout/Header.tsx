import React from 'react';
import styles from './Header.module.css';
import { SafeIcon } from '../ui/SafeIcon';
import { useAuthStore } from '../../stores/authStore';

const Header: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <SafeIcon size={28} className={styles.icon} />
        <span className={styles.brand}>EasySafe</span>
      </div>

      <div className={styles.right}>
        {user?.email && (
          <span className={styles.email}>{user.email}</span>
        )}
        <button
          type="button"
          className={styles.signOut}
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export { Header };
