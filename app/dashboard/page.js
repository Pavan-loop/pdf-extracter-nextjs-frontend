'use client';
import { useEffect, useState } from 'react';
import { dashboardApi, pdfApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import styles from './page.module.css';

function StatCard({ label, value, sub, accent, loading }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.accentCard : ''}`}>
      {loading ? (
        <>
          <div className={`skeleton ${styles.skW}`} style={{ height: 12, width: 80, marginBottom: 16 }} />
          <div className={`skeleton ${styles.skW}`} style={{ height: 48, width: 64 }} />
        </>
      ) : (
        <>
          <span className={styles.statLabel}>{label}</span>
          <span className={styles.statValue}>{value ?? '—'}</span>
          {sub && <span className={styles.statSub}>{sub}</span>}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    DONE: { cls: styles.done, label: 'DONE' },
    FAILED: { cls: styles.failed, label: 'FAILED' },
    PENDING: { cls: styles.pending, label: 'PENDING' },
    PROCESSING: { cls: styles.processing, label: 'PROCESSING' },
  };
  const s = map[status] || map.PENDING;
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState(null);
  const [results, setResults] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getCards()
      .then(r => setCards(r.data.data))
      .finally(() => setCardsLoading(false));

    pdfApi.getMyResults()
      .then(r => setResults(r.data.data?.slice(0, 8) || []))
      .finally(() => setResultsLoading(false));
  }, []);

  const completionRate = cards
    ? cards.records > 0 ? Math.round((cards.completed / cards.records) * 100) : 0
    : 0;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>
            {getGreeting()}, <span className={styles.name}>{user?.email?.split('@')[0]}</span>
          </p>
          <h1 className={styles.title}>Your Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.dateBadge}>{format(new Date(), 'EEE, MMM d yyyy')}</span>
          <a href="/dashboard/upload" className={styles.uploadBtn}>↑ Upload PDFs</a>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard label="SESSIONS" value={cards?.session} sub="Active workspaces" loading={cardsLoading} />
        <StatCard label="TOTAL RECORDS" value={cards?.records} sub="Documents processed" loading={cardsLoading} />
        <StatCard label="COMPLETED" value={cards?.completed} sub="Successful extractions" loading={cardsLoading} accent />
        <StatCard label="SUCCESS RATE" value={`${completionRate}%`} sub="Extraction accuracy" loading={cardsLoading} />
      </div>

      {/* ── Progress bar ── */}
      {!cardsLoading && cards && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>OVERALL COMPLETION</span>
            <span className={styles.progressPct}>{completionRate}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      {/* ── Recent Results ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Extractions</h2>
          <a href="/dashboard/results" className={styles.seeAll}>See all →</a>
        </div>

        {resultsLoading ? (
          <div className={styles.tableWrap}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`skeleton ${styles.skRow}`} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⬡</span>
            <p>No documents yet. <a href="/dashboard/upload" className={styles.link}>Upload your first PDF →</a></p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>FILENAME</th>
                  <th>TYPE</th>
                  <th>STATUS</th>
                  <th>JOB ID</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className={styles.tableRow}
                    onClick={() => window.location.href = `/dashboard/results?job=${r.jobId}`}>
                    <td>
                      <span className={styles.filename}>{r.filename || 'Unnamed'}</span>
                    </td>
                    <td>
                      <span className={styles.docType}>{r.documentType || 'UNKNOWN'}</span>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <span className={styles.jobId}>{r.jobId?.slice(0, 8)}…</span>
                    </td>
                    <td>
                      <span className={styles.date}>
                        {r.createdAt ? format(new Date(r.createdAt), 'MMM d, HH:mm') : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
