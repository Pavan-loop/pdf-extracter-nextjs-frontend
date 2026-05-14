'use client';
import styles from './QuotaModal.module.css';

export default function QuotaModal({ message, onClose }) {
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 3L25 23H3L14 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 11v5M14 19.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className={styles.title}>Page Limit Reached</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <a href="/pricing" className={styles.upgradeBtn}>
            Upgrade Plan →
          </a>
          <button className={styles.cancelBtn} onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
