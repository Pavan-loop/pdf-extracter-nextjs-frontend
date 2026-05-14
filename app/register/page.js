'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await authApi.register({ ...payload, phoneNumber: payload.phoneNumber ? Number(payload.phoneNumber) : null }, 'USER');
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.sub}>Join the PDF intelligence platform</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>FULL NAME</label>
              <input className={styles.input} placeholder="John Doe" value={form.name} onChange={set('name')} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>USERNAME</label>
              <input className={styles.input} placeholder="johndoe" value={form.username} onChange={set('username')} required />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>EMAIL</label>
            <input type="email" className={styles.input} placeholder="you@company.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>PASSWORD</label>
              <input type="password" className={styles.input} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>CONFIRM PASSWORD</label>
              <input
                type="password"
                className={`${styles.input} ${form.confirmPassword && form.confirmPassword !== form.password ? styles.inputError : ''}`}
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>PHONE (optional)</label>
            <input type="tel" className={styles.input} placeholder="+91 98765 43210" value={form.phoneNumber} onChange={set('phoneNumber')} />
          </div>

          <button type="submit" className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                CREATING ACCOUNT...
              </>
            ) : 'CREATE ACCOUNT →'}
          </button>
        </form>
      </div>
    </div>
  );
}
