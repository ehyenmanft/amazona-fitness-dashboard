import React, { useState, useMemo } from 'react';
import {
  FileText, ExternalLink, Search, ChevronDown, ChevronUp,
  UserCheck, Salad, Pill, Dumbbell, Lightbulb, CheckSquare, Code
} from 'lucide-react';
import { SECTION_ORDER, SECTION_META, normalize } from '../utils/planParser';

const ICON_MAP = {
  UserCheck, Salad, Pill, Dumbbell, Lightbulb, CheckSquare, FileText
};

export default function PlanViewer({
  planInfo,
  planStruct,
  rawMarkdown,
  isLoading,
  clientName
}) {
  const [searchInside, setSearchInside] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showRaw, setShowRaw] = useState(false);
  const [activePill, setActivePill] = useState(null);

  const availableSections = useMemo(() => {
    if (!planStruct) return [];
    return SECTION_ORDER.filter(key => planStruct[key] && planStruct[key].blocks.length > 0);
  }, [planStruct]);

  const toggleCollapse = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const anyCollapsed = availableSections.some(k => collapsedSections[k]);
    const next = {};
    availableSections.forEach(k => { next[k] = !anyCollapsed; });
    setCollapsedSections(next);
  };

  const scrollToSection = (key) => {
    setActivePill(key);
    const el = document.getElementById(`sec-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const normQuery = normalize(searchInside.trim());

  if (isLoading) {
    return (
      <section className="plan-viewer-empty">
        <div className="viewer-spinner"></div>
        <p>Cargando Data de Plan desde Google Drive...</p>
      </section>
    );
  }

  if (!planStruct && !rawMarkdown) {
    return (
      <section className="plan-viewer-empty">
        <FileText size={48} className="empty-icon" />
        <h3>Visor de Data de Plan</h3>
        <p>Selecciona un atleta y un archivo de Data de Plan para explorar su contenido estructurado.</p>
      </section>
    );
  }

  return (
    <section className="plan-viewer">
      {/* Encabezado del visor */}
      <div className="viewer-header">
        <div className="viewer-title-group">
          <h2 className="viewer-title">{clientName || planInfo?.name || 'Data de Plan'}</h2>
          <div className="viewer-meta">
            {planInfo?.name && <span className="meta-item">Archivo: {planInfo.name}</span>}
            {planInfo?.updatedAt && (
              <span className="meta-item">Actualizado: {new Date(planInfo.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {planInfo?.url && (
          <a
            href={planInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="drive-source-btn"
          >
            <ExternalLink size={14} />
            <span>Abrir en Drive</span>
          </a>
        )}
      </div>

      {/* Barra de herramientas */}
      <div className="viewer-toolbar">
        <div className="inside-search-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar dentro de este plan (macros, ejercicios, etc.)..."
            value={searchInside}
            onChange={e => setSearchInside(e.target.value)}
          />
          {searchInside && (
            <button className="clear-btn" onClick={() => setSearchInside('')}>✕</button>
          )}
        </div>

        <div className="toolbar-actions">
          <button className="tool-btn" onClick={toggleAll}>
            {availableSections.some(k => collapsedSections[k]) ? 'Expandir todo' : 'Contraer todo'}
          </button>
          <button
            className={`tool-btn ${showRaw ? 'active' : ''}`}
            onClick={() => setShowRaw(!showRaw)}
          >
            <Code size={14} />
            <span>Markdown original</span>
          </button>
        </div>
      </div>

      {/* Pestañas de navegación rápida por sección */}
      {availableSections.length > 0 && (
        <div className="section-pills-bar">
          {availableSections.map(key => {
            const meta = SECTION_META[key] || { label: key };
            const Icon = ICON_MAP[meta.icon] || FileText;
            return (
              <button
                key={key}
                className={`section-pill ${activePill === key ? 'active' : ''}`}
                onClick={() => scrollToSection(key)}
              >
                <Icon size={14} style={{ color: meta.color }} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Contenedor de contenido estructurado */}
      <div className="viewer-content">
        {showRaw ? (
          <div className="raw-markdown-box">
            <pre>{rawMarkdown}</pre>
          </div>
        ) : (
          availableSections.map(key => {
            const section = planStruct[key];
            const meta = SECTION_META[key] || { label: key };
            const isCollapsed = collapsedSections[key];
            const usefulBlocks = section.blocks.filter(b => b.type !== 'heading');

            // Filter blocks if search is active
            const visibleBlocks = usefulBlocks.filter(b => {
              if (!normQuery) return true;
              const content = JSON.stringify(b).toLowerCase();
              return normalize(content).includes(normQuery);
            });

            if (normQuery && visibleBlocks.length === 0) {
              return null;
            }

            const Icon = ICON_MAP[meta.icon] || FileText;

            return (
              <article key={key} id={`sec-${key}`} className="section-block-card">
                <div
                  className="section-card-header"
                  onClick={() => toggleCollapse(key)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="header-left">
                    <div className="section-icon-wrap" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                      <Icon size={18} />
                    </div>
                    <h3 className="section-card-title">{meta.label}</h3>
                    <span className="blocks-count-pill">
                      {usefulBlocks.length} bloque{usefulBlocks.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="header-right">
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="section-card-body">
                    {visibleBlocks.length === 0 ? (
                      <p className="empty-blocks">Sin coincidencias para la búsqueda.</p>
                    ) : (
                      visibleBlocks.map((block, bIdx) => (
                        <BlockRenderer key={bIdx} block={block} />
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function BlockRenderer({ block }) {
  if (block.type === 'table') {
    return (
      <div className="block-table-container">
        {block.title && <h4 className="block-subtitle">{block.title}</h4>}
        <div className="table-responsive-wrapper">
          <table className="plan-data-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (block.type === 'kv') {
    return (
      <div className="block-kv-container">
        {block.title && <h4 className="block-subtitle">{block.title}</h4>}
        <div className="kv-cards-grid">
          {block.pairs.map((p, idx) => (
            <div key={idx} className="kv-card-item">
              <span className="kv-key">{p.key}</span>
              <span className="kv-val">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === 'list') {
    return (
      <div className="block-list-container">
        {block.title && <h4 className="block-subtitle">{block.title}</h4>}
        <ul className="plan-checklist">
          {block.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className="block-text-container">
        {block.title && <h4 className="block-subtitle">{block.title}</h4>}
        <p className="block-paragraph">{block.content}</p>
      </div>
    );
  }

  return null;
}
