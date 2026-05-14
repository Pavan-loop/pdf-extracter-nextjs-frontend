'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { pdfApi } from '@/lib/api';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket';
import QuotaModal from '@/components/QuotaModal';
import { format } from 'date-fns';
import { DataViewer } from '@/components/DataViewer';
import styles from './upload.module.css';

function StatusBadge({ status }) {
  const map = {
    DONE: styles.done, FAILED: styles.failed,
    PENDING: styles.pending, PROCESSING: styles.processing,
  };
  return <span className={`${styles.badge} ${map[status] || styles.pending}`}>{status}</span>;
}

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [quotaMsg, setQuotaMsg] = useState(null);
  const [results, setResults] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const clientRef = useRef(null);

  // Connect WebSocket on mount
  useEffect(() => {
    clientRef.current = connectWebSocket((data) => {
      setResults((prev) => {
        const idx = prev.findIndex(r => r.jobId === data.jobId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data };
          return updated;
        }
        return [data, ...prev];
      });
    });

    // Watch connection
    const checkInterval = setInterval(() => {
      setWsConnected(clientRef.current?.active || false);
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      disconnectWebSocket();
    };
  }, []);

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
      const res = await pdfApi.upload(files);
      setUploadMsg({ type: 'success', text: res.data.message });
      // Add pending placeholders
      setResults(prev => [
        ...files.map((f, i) => ({
          jobId: `pending-${Date.now()}-${i}`,
          filename: f.name,
          status: 'PENDING',
          documentType: null,
          createdAt: new Date().toISOString(),
        })),
        ...prev,
      ]);
      setFiles([]);
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

  return (
    <div className={styles.page}>
      {quotaMsg && <QuotaModal message={quotaMsg} onClose={() => setQuotaMsg(null)} />}
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Dashboard / Upload</p>
          <h1 className={styles.title}>Upload PDFs</h1>
        </div>
        <div className={`${styles.wsIndicator} ${wsConnected ? styles.connected : styles.disconnected}`}>
          <span className={styles.wsDot} />
          <span>{wsConnected ? 'Live' : 'Connecting…'}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Left: Drop Zone ── */}
        <div className={styles.left}>
          <div
            {...getRootProps()}
            className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''}`}
          >
            <input {...getInputProps()} />
            <div className={styles.dropInner}>
              <div className={styles.dropIcon}>
                {isDragActive ? '⬇' : '⬡'}
              </div>
              <p className={styles.dropTitle}>
                {isDragActive ? 'Release to drop' : 'Drop PDFs here'}
              </p>
              <p className={styles.dropSub}>or click to browse — multiple files supported</p>
              <span className={styles.dropTag}>PDF ONLY</span>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className={styles.fileList}>
              <div className={styles.fileListHeader}>
                <span>{files.length} file{files.length > 1 ? 's' : ''} queued</span>
                <button className={styles.clearBtn} onClick={() => setFiles([])}>Clear all</button>
              </div>
              {files.map((f) => (
                <div key={f.name} className={styles.fileRow}>
                  <span className={styles.fileIcon}>⬡</span>
                  <div className={styles.fileMeta}>
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileSize}>{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFile(f.name)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {uploadMsg && (
            <div className={`${styles.msgBanner} ${uploadMsg.type === 'success' ? styles.msgSuccess : styles.msgError}`}>
              {uploadMsg.type === 'success' ? '✓' : '⚠'} {uploadMsg.text}
            </div>
          )}

          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={!files.length || uploading}
          >
            {uploading ? (
              <><span className={styles.spinner} /> Processing…</>
            ) : (
              `↑ Upload ${files.length > 0 ? `${files.length} ` : ''}PDF${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* ── Right: Live Results ── */}
        <div className={styles.right}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Live Results</h2>
            <span className={styles.resultsMono}>WebSocket stream</span>
          </div>

          {results.length === 0 ? (
            <div className={styles.resultsEmpty}>
              <div className={styles.emptyPulse} />
              <p>Waiting for documents…</p>
              <span>Upload PDFs to see real-time extraction results</span>
            </div>
          ) : (
            <div className={styles.resultsList}>
              {results.map((r, i) => (
                <div
                  key={r.jobId || i}
                  className={`${styles.resultCard} ${r.status === 'DONE' ? styles.resultDone : r.status === 'FAILED' ? styles.resultFailed : ''}`}
                >
                  <div className={styles.resultTop}>
                    <span className={styles.resultFile}>{r.filename || 'Processing…'}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className={styles.resultMeta}>
                    {r.documentType && (
                      <span className={styles.resultTag}>{r.documentType}</span>
                    )}
                    <span className={styles.resultTime}>
                      {r.createdAt ? format(new Date(r.createdAt), 'HH:mm:ss') : ''}
                    </span>
                  </div>
                  {r.status === 'DONE' && r.extractedData && (
                    <div className={styles.resultPreview} style={{ padding: '0 16px' }}>
                      <DataViewer data={r.extractedData} />
                    </div>
                  )}
                  {r.status === 'FAILED' && r.errorMessage && (
                    <p className={styles.resultError}>{r.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
