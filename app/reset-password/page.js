'use client';
import { Suspense, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './reset.module.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function ResetOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleDigitChange = (idx, raw) => {
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
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp(email, otp);
      const resetToken = res.data.data.resetToken;
      sessionStorage.setItem('reset_token', resetToken);
      router.push(`/set-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
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
      await authApi.forgotPassword(email);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(''));
      setResendMsg('New code sent — check your inbox.');
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
        <a href="/forgot-password" className={styles.back}>← Back</a>
        <div className={styles.brand}>
          <span className={styles.brandMark}>▲</span>
          <span className={styles.brandName}>DOCMADARA</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="3" y="6" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M3 10l10 6.5L23 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Enter Reset Code</h1>
          <p className={styles.sub}>
            We sent a 6-digit code to{' '}
            <span className={styles.emailHighlight}>{email || 'your email'}</span>
          </p>
          <p className={styles.expiry}>The code expires in 10 minutes.</p>
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

        {resendMsg && !error && (
          <div className={styles.infoBanner}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {resendMsg}
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
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`${styles.digitBox} ${d ? styles.digitFilled : ''}`}
                autoFocus={i === 0}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                disabled={loading}
              />
            ))}
          </div>

          <button
            type="submit"
            className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                VERIFYING...
              </>
            ) : 'VERIFY CODE →'}
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
              disabled={resendLoading || loading}
            >
              {resendLoading ? 'Sending…' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetOtpForm />
    </Suspense>
  );
}
