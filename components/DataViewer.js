'use client';
import { useState, useEffect } from 'react';

export function TableViewer({ dataArray }) {
  const [columns, setColumns] = useState([]);
  const [draggedCol, setDraggedCol] = useState(null);

  useEffect(() => {
    if (!Array.isArray(dataArray)) return;
    const colSet = new Set();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            colSet.add(k);
          }
        });
      }
    });

    const activeCols = Array.from(colSet);
    
    // Load saved global order
    try {
      const savedStr = localStorage.getItem('global-column-order');
      if (savedStr) {
        const savedGlobal = JSON.parse(savedStr);
        activeCols.sort((a, b) => {
          const idxA = savedGlobal.indexOf(a);
          const idxB = savedGlobal.indexOf(b);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1; // Unsaved columns to the end
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }
    } catch (err) {}

    setColumns([...activeCols]);
  }, [dataArray]);

  if (!Array.isArray(dataArray) || dataArray.length === 0) return <pre>{JSON.stringify(dataArray, null, 2)}</pre>;
  if (columns.length === 0) return null;

  const handleDragStart = (e, col) => {
    setDraggedCol(col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetCol) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetCol) return;
    setColumns(prev => {
      const idxFrom = prev.indexOf(draggedCol);
      const idxTo = prev.indexOf(targetCol);
      const copy = [...prev];
      copy.splice(idxFrom, 1);
      copy.splice(idxTo, 0, draggedCol);
      
      // Save to global storage
      try {
        const savedStr = localStorage.getItem('global-column-order');
        const existingGlobal = savedStr ? JSON.parse(savedStr) : [];
        const finalGlobal = [...copy];
        existingGlobal.forEach(c => {
          if (!finalGlobal.includes(c)) finalGlobal.push(c);
        });
        localStorage.setItem('global-column-order', JSON.stringify(finalGlobal));
      } catch (err) {}

      return copy;
    });
    setDraggedCol(null);
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%', margin: '12px 0', border: '1px solid var(--border)', borderRadius: '6px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-card)' }}>
            {columns.map(c => (
              <th 
                key={c} 
                draggable 
                onDragStart={(e) => handleDragStart(e, c)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, c)}
                style={{ 
                  padding: '8px 12px', 
                  textAlign: 'left', 
                  borderBottom: '1px solid var(--border)', 
                  fontWeight: 600, 
                  color: 'var(--text-sec)',
                  cursor: 'grab',
                  userSelect: 'none'
                }}
                title="Drag to reorder column"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataArray.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(c => (
                <td key={c} style={{ padding: '8px 12px' }}>{row[c] !== null && row[c] !== undefined ? String(row[c]) : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataViewer({ data }) {
  if (!data) return null;

  // If the extracted data itself is an array of line items
  if (Array.isArray(data)) {
    return <TableViewer dataArray={data} />;
  }

  // Filter to only display arrays (line items), per user request
  const arrayEntries = Object.entries(data).filter(([key, val]) => Array.isArray(val));

  if (arrayEntries.length === 0) {
    return <div><p style={{ color: 'var(--text-sec)' }}>No line items found in this document.</p></div>;
  }

  return (
    <div style={{ border: 'none', padding: 0, gap: '20px', width: '100%' }}>
      {arrayEntries.map(([key, val]) => (
        <div key={key} style={{ width: '100%' }}>
          <TableViewer dataArray={val} />
        </div>
      ))}
    </div>
  );
}
