'use client';
import { Suspense, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './otp.module.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const focusAt = (i) => inputs.current[i]?.focus();

  const handleChange = (idx, raw) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError('');
    if (char && idx < OTP_LENGTH - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        focusAt(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      focusAt(idx + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otpCode);
      setVerified(true);
      setTimeout(() => router.push('/login?verified=1'), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      focusAt(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    setError('');
    setResendLoading(true);
    try {
      await authApi.resendOtp(email);
      setCooldown(RESEND_COOLDOWN);
      setResendMsg('New code sent — check your inbox.');
      setDigits(Array(OTP_LENGTH).fill(''));
      focusAt(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <a href="/register" className={styles.back}>← Back to Register</a>
        <div className={styles.brand}>
          <span className={styles.brandMark}>▲</span>
          <span className={styles.brandName}>DOCMADARA</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M3 11l11 7 11-7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Verify Your Email</h1>
          <p className={styles.sub}>
            We sent a 6-digit code to{' '}
            <span className={styles.emailHighlight}>{email || 'your email address'}</span>
          </p>
          <p className={styles.expiry}>The code expires in 10 minutes.</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠</span> {error}
          </div>
        )}

        {verified && (
          <div className={styles.successBanner}>
            <span>✓</span> Email verified! Redirecting to login…
          </div>
        )}

        {resendMsg && !error && !verified && (
          <div className={styles.infoBanner}>
            <span>✓</span> {resendMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className={styles.form}>
          <div className={styles.otpRow} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`${styles.digitBox} ${d ? styles.digitFilled : ''}`}
                autoFocus={i === 0}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                disabled={verified}
              />
            ))}
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading || verified}
          >
            {loading ? <span className={styles.spinner} /> : 'VERIFY EMAIL →'}
          </button>
        </form>

        <div className={styles.resendRow}>
          {cooldown > 0 ? (
            <p className={styles.resendTimer}>
              Resend code in <span className={styles.countdown}>{cooldown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className={styles.resendBtn}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending…' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
