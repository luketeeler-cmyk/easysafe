import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';

const Layout: React.FC = () => (
  <div className={styles.root}>
    <Header />
    <CategoryNav />
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
);

export { Layout };
