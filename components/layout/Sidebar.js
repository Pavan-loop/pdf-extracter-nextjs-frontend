'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/upload', label: 'Upload', icon: '↑' },
  { href: '/dashboard/results', label: 'Results', icon: '≡' },
  { href: '/dashboard/sessions', label: 'Sessions', icon: '◎' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>▲</span>
        <span className={styles.brandName}>DOCMADARA</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navLabel}>WORKSPACE</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {pathname === item.href && <span className={styles.activeDot} />}
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={styles.userRole}>USER</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Sign out">
          ⏻
        </button>
      </div>
    </aside>
  );
}
