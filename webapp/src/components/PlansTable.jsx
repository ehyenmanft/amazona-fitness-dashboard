import React, { useState } from 'react';
import { FileText, ExternalLink, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PlansTable({ plans, onSelectClient }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(plans.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentPlans = plans.slice(startIndex, startIndex + pageSize);

  const renderBadge = (status) => {
    switch (status) {
      case 'PDF+MD':
        return <span className="status-badge ok">PDF + Data</span>;
      case 'PDF sin MD exacto':
        return <span className="status-badge bad">PDF sin Data exacta</span>;
      case 'MD solo':
        return <span className="status-badge mdonly">Data sola</span>;
      default:
        return <span className="status-badge default">{status || 'Sin plan'}</span>;
    }
  };

  const renderPdfLinks = (urls, filenames) => {
    if (!urls) return <span className="text-muted">—</span>;
    const list = String(urls).split(';').map(u => u.trim()).filter(Boolean);
    return (
      <div className="table-links-cell">
        {list.map((u, i) => (
          <a
            key={i}
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="table-drive-link"
          >
            <ExternalLink size={12} />
            <span>Abrir PDF {list.length > 1 ? i + 1 : ''}</span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <section className="plans-table-card">
      <div className="table-responsive-container">
        <table className="master-plans-table">
          <thead>
            <tr>
              <th>Atleta / Cliente</th>
              <th>Mes</th>
              <th>Fecha Carga</th>
              <th>PDF Drive</th>
              <th>Estado</th>
              <th>Archivo PDF</th>
              <th>Archivo Data</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {currentPlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty-row">
                  No se encontraron planes que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              currentPlans.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <button
                      className="client-link-btn"
                      onClick={() => onSelectClient && onSelectClient(r['Cliente'])}
                      title="Ver ficha detallada"
                    >
                      {r['Cliente']}
                    </button>
                  </td>
                  <td>
                    <span className="month-chip">{r['Mes plan'] || '—'}</span>
                  </td>
                  <td>{r['Fecha carga PDF'] || '—'}</td>
                  <td>{renderPdfLinks(r['URL PDF'])}</td>
                  <td>{renderBadge(r['Estado'])}</td>
                  <td className="text-truncate-cell" title={r['Archivo PDF']}>
                    {r['Archivo PDF'] || '—'}
                  </td>
                  <td className="text-truncate-cell" title={r['Archivo MD']}>
                    {r['Archivo MD'] || '—'}
                  </td>
                  <td className="obs-cell">{r['Observación'] || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Mostrando {startIndex + 1} - {Math.min(startIndex + pageSize, plans.length)} de {plans.length} planes
          </span>
          <div className="pagination-buttons">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <span className="page-indicator">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
