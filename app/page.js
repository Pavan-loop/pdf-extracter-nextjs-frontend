'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          Extractor
        </div>
        <div className={styles.navLinks}>
          {!loading && user ? (
            <Link href="/dashboard" className={styles.ctaBtn}>
              Enter Workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>Sign In</Link>
              <Link href="/login" className={styles.ctaBtn}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroBadge}>Next-Gen PDF Extraction v2.0</div>
        <h1 className={styles.heroTitle}>Extract the Undetectable.<br/>Instantly.</h1>
        <p className={styles.heroSubtitle}>
          Drop your isolated PDFs into real-time WebSockets, meticulously isolate line items, and dynamically merge arrays directly into native Excel files.
        </p>
        <div className={styles.heroActions}>
          <Link href={user ? "/dashboard" : "/login"} className={styles.primaryBtn}>
            Start Extracting Free <span>→</span>
          </Link>
          <a href="#features" className={styles.secondaryBtn}>
            Discover Features
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>⚡</div>
          <h3 className={styles.featureTitle}>Live WebSockets</h3>
          <p className={styles.featureText}>
            Watch files process in real-time. Drop your PDFs into the session workspace and see continuous status pushes directly from our extraction AI.
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔗</div>
          <h3 className={styles.featureTitle}>Interactive Mergers</h3>
          <p className={styles.featureText}>
            Select any combination of scanned documents. Instantly flatten their multi-dimensional JSON records together into a massive, cohesive table preview.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3 className={styles.featureTitle}>1-Click Excel Outputs</h3>
          <p className={styles.featureText}>
            Customize your columns. Drag boundaries in the UI to dictate visual structure, and hit Export to permanently lock those layouts directly into native XLSX tracking grids.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© {new Date().getFullYear()} Extractor. All rights reserved.</div>
        <div>Engineered for Speed & Scale</div>
      </footer>
    </div>
  );
}
