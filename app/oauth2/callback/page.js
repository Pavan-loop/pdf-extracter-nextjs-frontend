'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

function OAuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      Cookies.set('token', token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=oauth');
    }
  }, [params, router]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:32, height:32, border:'2px solid #2a2a2a', borderTop:'2px solid #e8ff47', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
      <p style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-muted)', letterSpacing:'0.1em' }}>Authenticating...</p>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
        <div style={{ width:32, height:32, border:'2px solid #2a2a2a', borderTop:'2px solid #e8ff47', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
        <p style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-muted)', letterSpacing:'0.1em' }}>Authenticating...</p>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
