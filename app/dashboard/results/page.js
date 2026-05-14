'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { pdfApi } from '@/lib/api';
import QuotaModal from '@/components/QuotaModal';
import { format } from 'date-fns';
import styles from './results.module.css';

function StatusBadge({ status }) {
  const map = { DONE: styles.done, FAILED: styles.failed, PENDING: styles.pending, PROCESSING: styles.processing };
  return <span className={`${styles.badge} ${map[status] || styles.pending}`}>{status}</span>;
}

import { DataViewer } from '@/components/DataViewer';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function ResultsPageContent() {
  const params = useSearchParams();
  const focusJob = params.get('job');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this PDF result?')) return;
    setDeletingId(id);
    try {
      await pdfApi.deleteResult(id);
      setResults(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      // silently ignore — item may already be gone
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    pdfApi.getMyResults()
      .then(r => {
        const data = r.data.data || [];
        setResults(data);
        if (focusJob) {
          const target = data.find(x => x.jobId === focusJob);
          if (target) setSelected(target);
        } else if (data.length > 0) {
          setSelected(data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [focusJob]);

  const filtered = results.filter(r => {
    const matchFilter = filter === 'ALL' || r.status === filter;
    const matchSearch = !search || r.filename?.toLowerCase().includes(search.toLowerCase())
      || r.jobId?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTERS = ['ALL', 'DONE', 'FAILED', 'PENDING', 'PROCESSING'];

  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const [selectedExportCols, setSelectedExportCols] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  const getMergedData = () => {
    const mergedArray = [];
    Array.from(selectedIds).forEach(id => {
      const doc = results.find(r => r.id === id);
      if (doc && doc.extractedData && doc.status === 'DONE') {
        const { extractedData } = doc;
        if (Array.isArray(extractedData)) {
            mergedArray.push(...extractedData.map(row => ({ ...row, _SourceDocument: doc.filename })));
        } else {
            Object.values(extractedData).forEach(v => {
                if (Array.isArray(v)) {
                   mergedArray.push(...v.map(row => ({ ...row, _SourceDocument: doc.filename })));
                }
            });
        }
      }
    });
    return mergedArray;
  };

  const isMerging = selectedIds.size > 0;

  const rawRows = isMerging ? getMergedData() : (selected?.extractedData ? (() => {
      const arr = [];
      if (Array.isArray(selected.extractedData)) arr.push(...selected.extractedData);
      else Object.values(selected.extractedData).forEach(v => { if (Array.isArray(v)) arr.push(...v); });
      return arr;
  })() : []);

  const availableColumns = Array.from(new Set(rawRows.flatMap(r => Object.keys(r))));

  useEffect(() => {
    setSelectedExportCols(new Set(availableColumns));
  }, [selectedIds, selected, results]); // Re-select all columns when switching datasets

  const toggleCol = (c) => {
    setSelectedExportCols(prev => {
      const copy = new Set(prev);
      if (copy.has(c)) copy.delete(c);
      else copy.add(c);
      return copy;
    });
  };

  // The active rows containing only the checked columns
  const filteredPreviewRows = rawRows.map(r => {
    const newRound = {};
    availableColumns.filter(c => selectedExportCols.has(c)).forEach(c => {
       if (r[c] !== undefined) newRound[c] = r[c];
    });
    return newRound;
  });

 const handleExportExcel = async () => {
  if (!filteredPreviewRows.length) return;

  const activeCols = availableColumns.filter(c => selectedExportCols.has(c));
  let savedGlobal = [];
  try {
    const savedStr = localStorage.getItem('global-column-order');
    if (savedStr) savedGlobal = JSON.parse(savedStr);
  } catch(e) {}

  activeCols.sort((a, b) => {
    const idxA = savedGlobal.indexOf(a);
    const idxB = savedGlobal.indexOf(b);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('LineItems');

  // Set columns
  worksheet.columns = activeCols.map(col => ({ header: col, key: col }));

  // Add rows
  filteredPreviewRows.forEach(row => {
    const mapped = {};
    activeCols.forEach(h => mapped[h] = row[h]);
    worksheet.addRow(mapped);
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Export_${Date.now()}.xlsx`);
};

  const renderExportModal = () => {
    if (!showExportModal) return null;
    return (
      <div className={styles.modalBackdrop} onClick={() => setShowExportModal(false)}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Columns to Export</h3>
            <button onClick={() => setShowExportModal(false)} className={styles.closeBtn}>✕</button>
          </div>
          <div className={styles.modalChecks}>
            {availableColumns.map(c => (
              <label key={c} className={`${styles.chkLabel} ${selectedExportCols.has(c) ? styles.chkActive : ''}`}>
                <input type="checkbox" checked={selectedExportCols.has(c)} onChange={() => toggleCol(c)} style={{ display: 'none' }} />
                {selectedExportCols.has(c) && <span>✓</span>} {c}
              </label>
            ))}
          </div>
          <div className={styles.modalFooter}>
             <button onClick={() => setShowExportModal(false)} className={styles.applyBtn}>Apply Settings</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {renderExportModal()}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Dashboard / Results</p>
          <h1 className={styles.title}>Extraction Results</h1>
        </div>
        <span className={styles.count}>{results.length} total documents</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by filename or job ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.split}>
        {/* List */}
        <div className={styles.list}>
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className={`skeleton ${styles.skItem}`} style={{ animationDelay: `${i * 0.06}s` }} />
              ))
            : filtered.length === 0
            ? <div className={styles.empty}>No results match your filter.</div>
            : filtered.map(r => (
                <div
                  key={r.id}
                  className={`${styles.listItem} ${selected?.id === r.id && !isMerging ? styles.listItemActive : ''}`}
                  onClick={() => {
                      setSelected(r);
                      if (isMerging) setSelectedIds(new Set());
                  }}
                >
                  <div className={styles.listTop}>
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => toggleSelection(e, r.id)}
                      checked={selectedIds.has(r.id)}
                      style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span className={styles.listFile}>{r.filename || 'Unnamed'}</span>
                    <StatusBadge status={r.status} />
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(e, r.id)}
                      disabled={deletingId === r.id}
                      title="Delete"
                    >
                      {deletingId === r.id ? '…' : '✕'}
                    </button>
                  </div>
                  <div className={styles.listMeta}>
                    <span className={styles.listType}>{r.documentType || 'UNKNOWN'}</span>
                    <span className={styles.listDate}>
                      {r.createdAt ? format(new Date(r.createdAt), 'MMM d, HH:mm') : '—'}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>

          {/* Detail panel */}
        <div className={styles.detail}>
          {isMerging ? (
            <div className={styles.detailContent}>
              <div className={styles.detailHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className={styles.detailFile}>Merged Preview ({selectedIds.size} documents)</h2>
                  <span className={styles.detailType}>Selected Items Combined</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowExportModal(true)} className={styles.settingsBtn}>⚙️ Columns</button>
                  <button onClick={handleExportExcel} className={styles.exportBtn} disabled={!filteredPreviewRows.length}>📥 Export to Excel</button>
                </div>
              </div>
              <div className={styles.dataSection}>
                <DataViewer data={filteredPreviewRows} />
              </div>
            </div>
          ) : !selected ? (
            <div className={styles.detailEmpty}>
              <span>←</span>
              <p>Select a document</p>
            </div>
          ) : (
            <div className={styles.detailContent} key={selected.id}>
              <div className={styles.detailHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className={styles.detailFile}>{selected.filename || 'Unnamed document'}</h2>
                  <div className={styles.detailMeta}>
                    <StatusBadge status={selected.status} />
                    {selected.documentType && (
                      <span className={styles.detailType}>{selected.documentType}</span>
                    )}
                  </div>
                </div>
                {selected.status === 'DONE' && selected.extractedData && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowExportModal(true)} className={styles.settingsBtn}>⚙️ Columns</button>
                    <button onClick={handleExportExcel} className={styles.exportBtn}>📥 Export to Excel</button>
                  </div>
                )}
              </div>

              {selected.status === 'FAILED' && selected.errorMessage && (
                <div className={styles.errorPanel}>
                  <span className={styles.errorTitle}>⚠ EXTRACTION FAILED</span>
                  <p>{selected.errorMessage}</p>
                </div>
              )}

              {selected.status === 'DONE' && selected.extractedData ? (
                <div className={styles.dataSection}>
                  <DataViewer data={Array.isArray(selected.extractedData) ? filteredPreviewRows : selected.extractedData} />
                </div>
              ) : selected.status !== 'FAILED' ? (
                <div className={styles.processingPanel}>
                  <div className={styles.processingSpinner} />
                  <p>Processing in progress…</p>
                  <span>Results will appear here when complete</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
