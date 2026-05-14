'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './forgot.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <a href="/login" className={styles.back}>← Back to Sign In</a>
        <div className={styles.brand}>
          <span className={styles.brandMark}>▲</span>
          <span className={styles.brandName}>DOCMADARA</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="7" y="13" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 13V9a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="14" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.sub}>
            Enter your account email and we'll send a reset code to your inbox.
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>EMAIL ADDRESS</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                SENDING RESET CODE...
              </>
            ) : 'SEND RESET CODE →'}
          </button>
        </form>

        <p className={styles.hint}>
          Remember your password?{' '}
          <a href="/login" className={styles.hintLink}>Sign in →</a>
        </p>
      </div>
    </div>
  );
}
