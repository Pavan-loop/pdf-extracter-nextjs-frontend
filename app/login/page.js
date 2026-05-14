'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

const UNVERIFIED_MSG = 'Account is not verified';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const justVerified = params.get('verified') === '1';
  const justReset = params.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      if (msg.includes(UNVERIFIED_MSG)) {
        setUnverifiedEmail(email);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  };

  return (
    <div className={styles.root}>
      <div className={styles.leftPanel}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>▲</span>
          <span className={styles.brandName}>DOCMADARA</span>
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.headline}>EXTRACT.<br />STRUCTURE.<br />DOMINATE.</h1>
          <p className={styles.sub}>
            AI-powered PDF intelligence for purchase orders,
            invoices & financial docs — processed in real-time.
          </p>
        </div>
        <div className={styles.tagRow}>
          <span className={styles.tag}>GPT-4o POWERED</span>
          <span className={styles.tag}>KAFKA PIPELINE</span>
          <span className={styles.tag}>LIVE WEBSOCKET</span>
        </div>
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign In</h2>
            <p className={styles.formSub}>Access your document intelligence hub</p>
          </div>

          {justVerified && (
            <div className={styles.successBanner}>
              <span>✓</span> Email verified. You can now sign in.
            </div>
          )}

          {justReset && (
            <div className={styles.successBanner}>
              <span>✓</span> Password reset successfully. Sign in with your new password.
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          {unverifiedEmail && (
            <div className={styles.warnBanner}>
              <span>⚠</span>
              Account not verified.{' '}
              <a
                href={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`}
                className={styles.warnLink}
              >
                Enter your OTP →
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className={styles.field}>
              <div className={styles.passwordRow}>
                <label className={styles.label}>PASSWORD</label>
                <a href="/forgot-password" className={styles.forgotLink}>Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'SIGN IN'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button onClick={handleGoogleLogin} className={styles.btnGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className={styles.registerLink}>
            No account?{' '}
            <a href="/register" className={styles.link}>Create one →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
