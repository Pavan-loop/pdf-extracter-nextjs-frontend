'use client';
import { useState, useEffect } from 'react';
import { sessionApi } from '@/lib/api';
import styles from './sessions.module.css';

const DOC_TYPES = ['PURCHASE_ORDER', 'INVOICE', 'BANK_STATEMENT', 'OTHERS'];

const COLOR_PRESETS = [
  '#e8ff47', '#47b8ff', '#4dff91', '#ff9747',
  '#ff4d4d', '#b847ff', '#ff47c8', '#47fff0',
];

import Link from 'next/link';

function SessionCard({ session, index }) {
  return (
    <Link href={`/dashboard/sessions/${session.id}`} className={styles.card} style={{ animationDelay: `${index * 0.06}s`, textDecoration: 'none' }}>
      <div className={styles.cardAccent} style={{ background: session.color || 'var(--accent)' }} />
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{session.sessionName}</span>
          <span className={styles.cardType}>{session.documentType}</span>
        </div>
        {session.Description && (
          <p className={styles.cardDesc}>{session.Description}</p>
        )}
        <div className={styles.cardFooter}>
          <span className={styles.cardId}>Session #{session.id || '—'}</span>
          <div className={styles.cardColor} style={{ background: session.color || 'var(--accent)' }} />
        </div>
      </div>
    </Link>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [fetchingSessions, setFetchingSessions] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sessionName: '', documentType: 'PURCHASE_ORDER', Description: '', color: '#e8ff47' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    sessionApi.getAll()
      .then(res => setSessions(res.data?.data || []))
      .catch(err => console.error('Failed to fetch sessions', err))
      .finally(() => setFetchingSessions(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await sessionApi.create(form);
      const newSession = { ...form, id: res.data.data?.id || res.data.data };
      setSessions(prev => [newSession, ...prev]);
      setSuccess(`Session "${form.sessionName}" created!`);
      setForm({ sessionName: '', documentType: 'PURCHASE_ORDER', Description: '', color: '#e8ff47' });
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Dashboard / Sessions</p>
          <h1 className={styles.title}>Sessions</h1>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          + New Session
        </button>
      </div>

      <p className={styles.description}>
        Organise your PDF uploads into sessions by document type for structured batch processing.
      </p>

      {fetchingSessions ? (
        <div className={styles.empty}>
          <div className={styles.emptyGraphic}>
             <span className={styles.spinner} style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <p className={styles.emptyTitle}>Loading Sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyGraphic}>
            <div className={styles.emptyBox} />
            <div className={styles.emptyBox} style={{ opacity: 0.4 }} />
            <div className={styles.emptyBox} style={{ opacity: 0.2 }} />
          </div>
          <p className={styles.emptyTitle}>No sessions yet</p>
          <p className={styles.emptySub}>Create your first session to start organising documents.</p>
          <button className={styles.emptyBtn} onClick={() => setShowModal(true)}>Create Session →</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {sessions.map((s, i) => <SessionCard key={s.id || i} session={s} index={i} />)}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Session</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className={styles.errorBanner}><span>⚠</span> {error}</div>}
            {success && <div className={styles.successBanner}><span>✓</span> {success}</div>}

            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>SESSION NAME</label>
                <input
                  className={styles.input} placeholder="e.g. Q1 Purchase Orders"
                  value={form.sessionName} onChange={set('sessionName')} required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>DOCUMENT TYPE</label>
                <select className={styles.select} value={form.documentType} onChange={set('documentType')}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>DESCRIPTION (optional)</label>
                <textarea
                  className={styles.textarea} placeholder="What is this session for?"
                  value={form.Description} onChange={set('Description')} rows={3}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>COLOR TAG</label>
                <div className={styles.colorRow}>
                  {COLOR_PRESETS.map(c => (
                    <button
                      type="button" key={c}
                      className={`${styles.colorDot} ${form.color === c ? styles.colorDotActive : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                    />
                  ))}
                  <input
                    type="color" className={styles.colorInput}
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    title="Custom color"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'CREATE SESSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
