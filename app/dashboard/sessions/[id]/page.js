'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { pdfApi, sessionApi } from '@/lib/api';
import QuotaModal from '@/components/QuotaModal';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket';
import { format } from 'date-fns';
import Link from 'next/link';
import { DataViewer } from '@/components/DataViewer';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import styles from '../../results/results.module.css';
import uploadStyles from '../../upload/upload.module.css';
import { use } from 'react';

function StatusBadge({ status }) {
  const map = {
    DONE: uploadStyles.done, FAILED: uploadStyles.failed,
    PENDING: uploadStyles.pending, PROCESSING: uploadStyles.processing,
  };
  return <span className={`${uploadStyles.badge} ${map[status] || uploadStyles.pending}`}>{status}</span>;
}

export default function SessionWorkspacePage({ params }) {
  const { id: sessionId } = use(params);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    sessionApi.getAll().then(res => {
       const all = res.data?.data || [];
       const current = all.find(s => String(s.id) === String(sessionId));
       if (current) setSessionInfo(current);
    }).catch(console.error);
  }, [sessionId]);
  
  // -- Upload State --
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [quotaMsg, setQuotaMsg] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const clientRef = useRef(null);

  // -- Results State --
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedExportCols, setSelectedExportCols] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      const r = await pdfApi.getSessionResults(sessionId);
      const dbData = r.data?.data || [];
      setResults(prev => {
        const updatedDbData = dbData.map(dbRow => {
           const existing = prev.find(x => x.jobId === dbRow.jobId);
           return existing ? { ...dbRow, ...existing, id: dbRow.id } : dbRow;
        });
        const strays = prev.filter(x => 
           !String(x.jobId).startsWith('pending-') && 
           !dbData.some(d => d.jobId === x.jobId)
        );
        const merged = [...strays, ...updatedDbData];
        // Sort newest first
        merged.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return merged;
      });
      return dbData.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch {}
  }, []);

  // Connect WebSocket on mount
  useEffect(() => {
    fetchResults();

    clientRef.current = connectWebSocket((data) => {
      setResults((prev) => {
        const idx = prev.findIndex(r => r.jobId === data.jobId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data };
          if (selected?.jobId === data.jobId) setSelected(updated[idx]);
          return updated;
        }
        // If not found in prev, append it (fetchResults will fix the missing name later)
        return [{ ...data, createdAt: new Date().toISOString() }, ...prev];
      });
    });

    const checkInterval = setInterval(() => {
      setWsConnected(clientRef.current?.active || false);
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      disconnectWebSocket();
    };
  }, [fetchResults, selected]);

  // -- Upload Handlers --
  const onDrop = useCallback((accepted) => {
    const pdfs = accepted.filter(f => f.type === 'application/pdf');
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !names.has(f.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: true,
  });

  const removeFile = (name) => setFiles(f => f.filter(x => x.name !== name));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await pdfApi.upload(files, sessionId);
      setUploadMsg({ type: 'success', text: res.data.message });
      setFiles([]);
      // Fetch the real records so the WebSocket matches them properly by jobId
      const newDocs = await fetchResults();
      if (newDocs && newDocs.length > 0) {
        setSelected(newDocs[0]);
        setSelectedIds(new Set()); // exit merge mode
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setQuotaMsg(err.response.data.message);
      } else {
        setUploadMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
      }
    } finally {
      setUploading(false);
    }
  };

  // -- Multi-Select & Merge Logic --
  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const getMergedData = () => {
    const mergedArray = [];
    Array.from(selectedIds).forEach(id => {
      const doc = results.find(r => r.id === id || r.jobId === id);
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
  }, [selectedIds, selected, results]); 

  const toggleCol = (c) => {
    setSelectedExportCols(prev => {
      const copy = new Set(prev);
      if (copy.has(c)) copy.delete(c);
      else copy.add(c);
      return copy;
    });
  };

  const filteredPreviewRows = rawRows.map(r => {
    const newRound = {};
    availableColumns.filter(c => selectedExportCols.has(c)).forEach(c => {
       if (r[c] !== undefined) newRound[c] = r[c];
    });
    return newRound;
  });

  const handleExportExcel = async () => {
  if (!filteredPreviewRows.length) return alert('No line items to export!');

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

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('LineItems');

  worksheet.columns = activeCols.map(col => ({ header: col, key: col }));

  filteredPreviewRows.forEach(row => {
    const mapped = {};
    activeCols.forEach(h => mapped[h] = row[h]);
    worksheet.addRow(mapped);
  });

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
      {quotaMsg && <QuotaModal message={quotaMsg} onClose={() => setQuotaMsg(null)} />}
      {renderExportModal()}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/dashboard/sessions" style={{ color: 'inherit', textDecoration: 'none' }}>
              Dashboard / Sessions
            </Link> 
            {' / '}
            <span style={{ color: 'var(--text)' }}>{sessionInfo?.sessionName || sessionId}</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              href="/dashboard/sessions" 
              style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '28px', transition: 'color 0.2s', marginTop: '-4px' }}
              onMouseOver={(e) => e.target.style.color = 'var(--text)'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              title="Back to Sessions"
            >
              ←
            </Link>
            <h1 className={styles.title} style={{ margin: 0 }}>
              {sessionInfo ? `${sessionInfo.sessionName} Workspace` : 'Workspace'}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className={`${uploadStyles.wsIndicator} ${wsConnected ? uploadStyles.connected : uploadStyles.disconnected}`}>
            <span className={uploadStyles.wsDot} />
            <span>{wsConnected ? 'Live' : 'Connecting…'}</span>
          </div>
          <span className={styles.count}>{results.length} total documents</span>
        </div>
      </div>

      <div className={styles.split}>
        {/* -- Left: Dropzone + List -- */}
        <div className={styles.list} style={{ padding: 0 }}>
          
          {/* Dropzone Top Area */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <div
              {...getRootProps()}
              className={`${uploadStyles.dropzone} ${isDragActive ? uploadStyles.dragActive : ''}`}
            >
              <input {...getInputProps()} />
              <div className={uploadStyles.dropInner} style={{ minHeight: '120px' }}>
                <p className={uploadStyles.dropTitle} style={{ fontSize: '14px' }}>
                  {isDragActive ? 'Drop here' : 'Drop PDFs here'}
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className={uploadStyles.fileList} style={{ marginTop: '16px' }}>
                <div className={uploadStyles.fileListHeader}>
                  <span>{files.length} queued</span>
                  <button className={uploadStyles.clearBtn} onClick={() => setFiles([])}>Clear</button>
                </div>
                {files.map((f) => (
                  <div key={f.name} className={uploadStyles.fileRow}>
                    <span className={uploadStyles.fileIcon}>⬡</span>
                    <div className={uploadStyles.fileMeta}>
                      <span className={uploadStyles.fileName}>{f.name}</span>
                    </div>
                    <button className={uploadStyles.removeBtn} onClick={() => removeFile(f.name)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {uploadMsg && (
              <div style={{ marginTop: '12px' }} className={`${uploadStyles.msgBanner} ${uploadMsg.type === 'success' ? uploadStyles.msgSuccess : uploadStyles.msgError}`}>
                {uploadMsg.type === 'success' ? '✓' : '⚠'} {uploadMsg.text}
              </div>
            )}

            <button
              className={uploadStyles.uploadBtn}
              onClick={handleUpload}
              disabled={!files.length || uploading}
              style={{ marginTop: '16px', width: '100%' }}
            >
              {uploading ? <><span className={uploadStyles.spinner} /> Processing…</> : `↑ Upload`}
            </button>
          </div>

          <p style={{ margin: '16px 24px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase' }}>Documents</p>
          
          {results.length === 0 ? (
             <div className={styles.empty}>No documents yet. Upload one above.</div>
          ) : (
            results.map(r => (
              <div
                key={r.id || r.jobId}
                className={`${styles.listItem} ${selected?.jobId === r.jobId && !isMerging ? styles.listItemActive : ''}`}
                onClick={() => {
                    setSelected(r);
                    if (isMerging) setSelectedIds(new Set());
                }}
                style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
              >
                <div className={styles.listTop}>
                  <input 
                    type="checkbox" 
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => toggleSelection(e, r.id || r.jobId)} 
                    checked={selectedIds.has(r.id || r.jobId)}
                    style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span className={styles.listFile}>{r.filename || 'Unnamed'}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className={styles.listMeta}>
                  <span className={styles.listType}>{r.documentType || 'UNKNOWN'}</span>
                  <span className={styles.listDate}>
                    {r.createdAt ? format(new Date(r.createdAt), 'MMM d, HH:mm') : '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* -- Right: Detail / Merged Panel -- */}
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
                  <button onClick={handleExportExcel} className={styles.exportBtn}>📥 Export to Excel</button>
                </div>
              </div>
              <div className={styles.dataSection}>
                <DataViewer data={filteredPreviewRows} />
              </div>
            </div>
          ) : !selected ? (
            <div className={styles.detailEmpty}>
              <span>←</span>
              <p>Upload or select a document</p>
            </div>
          ) : (
            <div className={styles.detailContent} key={selected.jobId}>
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
