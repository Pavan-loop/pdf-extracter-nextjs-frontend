'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './setpassword.module.css';

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Guard: if no reset token in session, send back to OTP screen
  useEffect(() => {
    const token = sessionStorage.getItem('reset_token');
    if (!token) {
      router.replace(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const resetToken = sessionStorage.getItem('reset_token');
    if (!resetToken) {
      router.replace(`/reset-password?email=${encodeURIComponent(email)}`);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      sessionStorage.removeItem('reset_token');
      setSuccess(true);
      setTimeout(() => router.push('/login?reset=1'), 1600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Please try again.';
      // Expired/invalid token → send back to OTP screen to get a fresh one
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expir')) {
        sessionStorage.removeItem('reset_token');
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <a href={`/reset-password?email=${encodeURIComponent(email)}`} className={styles.back}>
          ← Back
        </a>
        <div className={styles.brand}>
          <span className={styles.brandMark}>▲</span>
          <span className={styles.brandName}>DOCMADARA</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="6" y="12" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 12V8.5a4 4 0 018 0V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="13" cy="17" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.sub}>
            Choose a strong password for{' '}
            <span className={styles.emailHighlight}>{email || 'your account'}</span>
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

        {success && (
          <div className={styles.successBanner}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Password updated! Redirecting to login…
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>NEW PASSWORD</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              required
              minLength={8}
              autoFocus
              disabled={success}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CONFIRM PASSWORD</label>
            <input
              type="password"
              className={`${styles.input} ${confirmPassword && confirmPassword !== newPassword ? styles.inputError : ''}`}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              required
              disabled={success}
            />
          </div>

          <button
            type="submit"
            className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                RESETTING PASSWORD...
              </>
            ) : 'RESET PASSWORD →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
