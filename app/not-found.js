import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.14em',
        color: 'var(--accent)',
        marginBottom: '16px',
        textTransform: 'uppercase',
      }}>
        404
      </p>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(48px, 8vw, 96px)',
        letterSpacing: '0.03em',
        color: 'var(--text)',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        PAGE NOT FOUND
      </h1>
      <p style={{
        fontSize: '15px',
        color: 'var(--text-muted)',
        maxWidth: '400px',
        lineHeight: 1.7,
        marginBottom: '40px',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" style={{
        background: 'var(--accent)',
        color: '#000',
        padding: '12px 28px',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: '500',
        letterSpacing: '0.08em',
        textDecoration: 'none',
      }}>
        GO HOME →
      </Link>
    </div>
  );
}
