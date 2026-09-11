import React, { useState } from 'react';
import { Calendar, Clock, ExternalLink, FileText, FolderGit2, CheckCircle, ChevronRight } from 'lucide-react';
import { getClientRenewalSummary, formatDateES } from '../utils/renewals';

export default function ClientDetail({
  uniqueClients,
  selectedClient,
  onSelectClient,
  plans,
  mdFiles,
  selectedFileId,
  onSelectFile
}) {
  const [driveTab, setDriveTab] = useState('pdf');

  const summary = selectedClient
    ? getClientRenewalSummary(selectedClient, plans, mdFiles)
    : null;

  // Filter client plans & md files
  const clientPlans = plans.filter(
    p => (p['Cliente'] || '').toLowerCase() === (selectedClient || '').toLowerCase()
  );

  const clientMdFiles = mdFiles.filter(
    m => (m['Cliente'] || '').toLowerCase() === (selectedClient || '').toLowerCase()
  );

  const pdfLinks = [];
  clientPlans.forEach(r => {
    const urls = String(r['URL PDF'] || '').split(';').map(u => u.trim()).filter(Boolean);
    urls.forEach((url, idx) => {
      pdfLinks.push({
        url,
        title: r['Archivo PDF'] || `Plan PDF ${idx + 1}`,
        meta: [r['Mes plan'], r['Fecha carga PDF'], r['Estado']].filter(Boolean).join(' · ')
      });
    });
  });

  const dataLinks = [];
  clientMdFiles.forEach(m => {
    const url = m['MD URL'] || (m['MD file ID'] ? `https://drive.google.com/file/d/${m['MD file ID']}/view` : '');
    if (url) {
      dataLinks.push({
        url,
        title: m['Archivo MD'] || 'Data de Plan',
        meta: [m['Mes plan'], m['Fecha carga MD'] ? formatDateES(m['Fecha carga MD']) : ''].filter(Boolean).join(' · ')
      });
    }
  });

  const activeLinks = driveTab === 'pdf' ? pdfLinks : dataLinks;

  return (
    <aside className="client-sidebar">
      <div className="sidebar-group">
        <label className="sidebar-label">Seleccionar Atleta / Cliente</label>
        <select
          className="client-selector"
          value={selectedClient}
          onChange={e => onSelectClient(e.target.value)}
        >
          <option value="">Selecciona un atleta...</option>
          {uniqueClients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {selectedClient && summary && (
        <>
          {/* Resumen de Vigencia y Renovación */}
          <div className="client-summary-card">
            <div className="summary-header">
              <span className="summary-title">{selectedClient}</span>
              <span className="summary-sub">Ciclo y proyección de renovación</span>
            </div>

            <div className="metrics-list">
              <div className="metric-row">
                <span className="metric-label">Histórico de Planes:</span>
                <div className="plan-chips">
                  {summary.dates.length > 0 ? (
                    summary.dates.map((d, i) => (
                      <span key={i} className="date-chip">
                        {d.month ? `${d.month}: ` : ''}{formatDateES(d.date)}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">Sin fechas registradas</span>
                  )}
                </div>
              </div>

              <div className="metric-row">
                <span className="metric-label">Frecuencia Estimada:</span>
                <span className="metric-val">{summary.frequencyText}</span>
              </div>

              <div className="metric-row highlight">
                <span className="metric-label">Fecha Proyectada:</span>
                <span className="metric-val text-accent">{summary.renewalText}</span>
              </div>
            </div>
          </div>

          {/* Drive Panel */}
          <div className="client-drive-card">
            <div className="drive-header">
              <div className="drive-title">
                <FolderGit2 size={16} />
                <span>Archivos Drive del Cliente</span>
              </div>
              <span className="drive-count">
                {pdfLinks.length} PDF · {dataLinks.length} Data
              </span>
            </div>

            <div className="drive-tab-buttons">
              <button
                className={`drive-tab-btn ${driveTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setDriveTab('pdf')}
              >
                PDFs ({pdfLinks.length})
              </button>
              <button
                className={`drive-tab-btn ${driveTab === 'data' ? 'active' : ''}`}
                onClick={() => setDriveTab('data')}
              >
                Data Markdown ({dataLinks.length})
              </button>
            </div>

            <div className="drive-links-box">
              {activeLinks.length === 0 ? (
                <div className="drive-empty">
                  No hay archivos {driveTab === 'pdf' ? 'PDF' : 'de Data'} vinculados.
                </div>
              ) : (
                activeLinks.map((item, idx) => (
                  <div key={idx} className="drive-link-row">
                    <div className="drive-info">
                      <span className="drive-item-title">{item.title}</span>
                      <span className="drive-item-meta">{item.meta}</span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drive-open-btn"
                      title="Abrir en Google Drive"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Archivos Markdown Disponibles */}
          <div className="md-files-card">
            <div className="md-files-title">
              <FileText size={15} />
              <span>Data de Plan Disponibles</span>
            </div>

            {clientMdFiles.length === 0 ? (
              <div className="md-empty">No hay Data de Plan indexada para este cliente.</div>
            ) : (
              <div className="md-items-list">
                {clientMdFiles.map((m, idx) => {
                  const isSelected = selectedFileId === m['MD file ID'];
                  return (
                    <div
                      key={m['MD file ID'] || idx}
                      className={`md-file-item ${isSelected ? 'active' : ''}`}
                      onClick={() => onSelectFile(m['MD file ID'])}
                    >
                      <div className="md-item-top">
                        <span className="md-month">{m['Mes plan'] || 'Plan'}</span>
                        {idx === 0 && <span className="latest-tag">Más reciente</span>}
                      </div>
                      <span className="md-filename">{m['Archivo MD']}</span>
                      <span className="md-id-code">{m['MD file ID']}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
