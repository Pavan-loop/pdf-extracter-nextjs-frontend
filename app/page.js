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
          <div className={styles.logoMark}>D</div>
          DocMadara
        </div>
        <div className={styles.navCenter}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how-it-works" className={styles.navLink}>How It Works</a>
        </div>
        <div className={styles.navRight}>
          {!loading && user ? (
            <Link href="/dashboard" className={styles.ctaBtn}>Enter Workspace</Link>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>Sign In</Link>
              <Link href="/login" className={styles.ctaBtn}>Get Started Free</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            AI-Powered Document Intelligence
          </div>
          <h1 className={styles.heroTitle}>
            Turn Any PDF Into<br />
            <span className={styles.heroAccent}>Structured Data</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Upload your PDFs and watch real-time AI extraction turn raw documents
            into clean, structured spreadsheets — ready to export in seconds.
          </p>
          <div className={styles.heroActions}>
            <Link href={user ? '/dashboard' : '/login'} className={styles.primaryBtn}>
              Start Extracting Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#how-it-works" className={styles.secondaryBtn}>
              See How It Works
            </a>
          </div>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>10,000+</span>
            <span className={styles.statLabel}>Documents Processed</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>99.8%</span>
            <span className={styles.statLabel}>Extraction Accuracy</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>&lt; 30s</span>
            <span className={styles.statLabel}>Avg. Processing Time</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>.XLSX</span>
            <span className={styles.statLabel}>Native Excel Export</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Features</div>
          <h2 className={styles.sectionTitle}>Everything you need to extract data at scale</h2>
          <p className={styles.sectionSubtitle}>
            From upload to export, every step is optimised for accuracy, speed, and ease of use.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Real-Time Processing</h3>
            <p className={styles.featureText}>
              WebSocket-powered live updates stream extraction progress directly to your screen. No page refreshes — just instant, continuous feedback.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2" y="4" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M5 4V3a1 1 0 011-1h6a1 1 0 011 1v1M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Smart Field Detection</h3>
            <p className={styles.featureText}>
              Automatically identifies tables, line items, headers, and nested structures across any PDF layout — invoices, reports, forms, and more.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Multi-Document Merge</h3>
            <p className={styles.featureText}>
              Select multiple extracted documents and merge their data into a single unified table. Perfect for batch processing and bulk reporting.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 13l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>1-Click Excel Export</h3>
            <p className={styles.featureText}>
              Export structured data as native .xlsx files. Column layouts, formatting, and structure are preserved exactly as you configured them.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Session History</h3>
            <p className={styles.featureText}>
              Every extraction is saved. Revisit any past session, re-export data, or compare results across multiple document runs with full history.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M8 2H4a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V8M8 2l6 6M8 2v5a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Custom Column Mapping</h3>
            <p className={styles.featureText}>
              Rename, reorder, and hide columns before export. Define exactly which fields matter and how they appear in your final spreadsheet.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Process</div>
          <h2 className={styles.sectionTitle}>From PDF to spreadsheet in three steps</h2>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNum}>01</div>
            <h3 className={styles.stepTitle}>Upload Your PDFs</h3>
            <p className={styles.stepText}>
              Drag and drop one or more PDF files into a new session. Supports scanned documents, digital PDFs, and complex multi-page files.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>02</div>
            <h3 className={styles.stepTitle}>AI Extracts the Data</h3>
            <p className={styles.stepText}>
              The extraction engine identifies structure, tables, and fields in real time. Watch progress live via WebSocket as results stream in.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>03</div>
            <h3 className={styles.stepTitle}>Export to Excel</h3>
            <p className={styles.stepText}>
              Review data in the interactive table viewer. Merge results from multiple PDFs, configure your columns, then export to .xlsx instantly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to extract your first document?</h2>
          <p className={styles.ctaSubtitle}>Get started for free. No credit card required.</p>
          <Link href={user ? '/dashboard' : '/login'} className={styles.ctaLargeBtn}>
            Start Extracting Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <div className={styles.logoMark}>D</div>
          DocMadara
        </div>
        <div className={styles.footerLinks}>
          <a href="#features" className={styles.footerLink}>Features</a>
          <a href="#how-it-works" className={styles.footerLink}>How It Works</a>
          <Link href="/login" className={styles.footerLink}>Sign In</Link>
        </div>
        <div className={styles.footerCopy}>
          © {new Date().getFullYear()} DocMadara. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
