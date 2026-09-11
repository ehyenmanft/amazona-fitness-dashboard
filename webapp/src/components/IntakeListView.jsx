import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Eye, CheckCircle2, Clock, ExternalLink,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, User, DollarSign, MapPin,
  X, Download, ArrowUpDown, FileCheck, Phone, Mail, SlidersHorizontal
} from 'lucide-react';
import { normalize } from '../utils/planParser';
import { formatDateDisplay } from '../utils/dateUtils';

export default function IntakeListView({
  responses = [],
  onSelectResponse,
  onUpdateStatus,
  isLiveSupabase,
  isLiveGAS
}) {
  // Estado de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [receiptFilter, setReceiptFilter] = useState(''); // '' | 'with' | 'without'
  const [genderFilter, setGenderFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all' | '7d' | '30d' | '2024' | 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Lista dinámica de métodos de pago únicos presentes en los datos
  const uniquePayments = useMemo(() => {
    const set = new Set();
    responses.forEach(r => {
      const p = (r.metodo_pago || '').trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [responses]);

  // Lista dinámica de géneros presentes
  const uniqueGenders = useMemo(() => {
    const set = new Set();
    responses.forEach(r => {
      const g = (r.genero || '').trim();
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [responses]);

  // Conteo de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (statusFilter) count++;
    if (paymentFilter) count++;
    if (receiptFilter) count++;
    if (genderFilter) count++;
    if (dateRangeFilter !== 'all') count++;
    if (customDateFrom || customDateTo) count++;
    return count;
  }, [searchTerm, statusFilter, paymentFilter, receiptFilter, genderFilter, dateRangeFilter, customDateFrom, customDateTo]);

  // Restablecer todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentFilter('');
    setReceiptFilter('');
    setGenderFilter('');
    setDateRangeFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Filtrado y ordenación
  const filteredAndSorted = useMemo(() => {
    const q = normalize(searchTerm.trim());
    const now = new Date();

    const filtered = (responses || []).filter(item => {
      // 1. Filtro por Estado de Verificación
      if (statusFilter && item.estado_pago !== statusFilter) return false;

      // 2. Filtro por Método de Pago
      if (paymentFilter) {
        if (paymentFilter === 'Sin especificar') {
          if (item.metodo_pago && item.metodo_pago.trim() !== '') return false;
        } else if (item.metodo_pago !== paymentFilter) {
          return false;
        }
      }

      // 3. Filtro por Comprobante
      if (receiptFilter === 'with' && !item.comprobante_url) return false;
      if (receiptFilter === 'without' && item.comprobante_url) return false;

      // 4. Filtro por Género
      if (genderFilter && (item.genero || '').toLowerCase() !== genderFilter.toLowerCase()) return false;

      // 5. Filtro por Fecha
      const itemTimestamp = item.timestamp || 0;
      if (itemTimestamp > 0) {
        if (dateRangeFilter === '7d') {
          const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
          if (itemTimestamp < sevenDaysAgo) return false;
        } else if (dateRangeFilter === '30d') {
          const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);
          if (itemTimestamp < thirtyDaysAgo) return false;
        } else if (dateRangeFilter === '2024') {
          const date = new Date(itemTimestamp);
          if (date.getFullYear() !== 2024) return false;
        } else if (dateRangeFilter === '2025_2026') {
          const date = new Date(itemTimestamp);
          if (date.getFullYear() < 2025) return false;
        } else if (dateRangeFilter === 'custom') {
          if (customDateFrom) {
            const fromTs = new Date(customDateFrom).getTime();
            if (itemTimestamp < fromTs) return false;
          }
          if (customDateTo) {
            const toTs = new Date(customDateTo).setHours(23, 59, 59, 999);
            if (itemTimestamp > toTs) return false;
          }
        }
      }

      // 6. Buscador global (Omnisearch)
      if (q) {
        const textToSearch = [
          item.nombre_completo,
          item.email,
          item.telefono,
          item.pais_ciudad,
          item.objetivo_principal,
          item.metodo_pago,
          item.disciplina_deportiva
        ].filter(Boolean).join(' ');
        if (!normalize(textToSearch).includes(q)) return false;
      }

      return true;
    });

    // Ordenación
    return filtered.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortBy === 'date_asc') {
        return (a.timestamp || 0) - (b.timestamp || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.nombre_completo || '').localeCompare(b.nombre_completo || '');
      }
      if (sortBy === 'name_desc') {
        return (b.nombre_completo || '').localeCompare(a.nombre_completo || '');
      }
      return 0;
    });
  }, [
    responses,
    searchTerm,
    statusFilter,
    paymentFilter,
    receiptFilter,
    genderFilter,
    dateRangeFilter,
    customDateFrom,
    customDateTo,
    sortBy
  ]);

  // Ajustar página actual si excede el total
  const totalPages = pageSize === 'all'
    ? 1
    : Math.max(1, Math.ceil(filteredAndSorted.length / (pageSize || 15)));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredAndSorted;
    const start = (safePage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, safePage, pageSize]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!filteredAndSorted.length) return;

    const headers = [
      'ID', 'Fecha Envio', 'Nombre Completo', 'Email', 'Telefono',
      'Ubicacion', 'Edad', 'Genero', 'Estatura (m)', 'Peso Actual (kg)',
      'Objetivo Principal', 'Metodo de Pago', 'Estado Verificacion', 'Comprobante URL'
    ];

    const rows = filteredAndSorted.map(item => [
      `"${item.id || ''}"`,
      `"${item.fecha_display || formatDateDisplay(item.marca_temporal) || ''}"`,
      `"${(item.nombre_completo || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.telefono || '').replace(/"/g, '""')}"`,
      `"${(item.pais_ciudad || '').replace(/"/g, '""')}"`,
      `"${item.edad || ''}"`,
      `"${item.genero || ''}"`,
      `"${item.estatura_m || ''}"`,
      `"${item.peso_actual_kg || ''}"`,
      `"${(item.objetivo_principal || '').replace(/"/g, '""')}"`,
      `"${(item.metodo_pago || '').replace(/"/g, '""')}"`,
      `"${item.estado_pago || ''}"`,
      `"${item.comprobante_url || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `respuestas_atletas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determinar texto y clase de la insignia de sincronización
  const syncBadge = useMemo(() => {
    if (isLiveGAS) {
      return { text: 'Sincronizado con Google Sheets', className: 'live' };
    }
    if (isLiveSupabase) {
      return { text: 'Sincronizado con Supabase', className: 'live' };
    }
    return { text: 'Modo Demo / Sin conexión', className: 'demo' };
  }, [isLiveGAS, isLiveSupabase]);

  return (
    <section className="intake-list-section">
      {/* Barra de Filtros Avanzada y Responsiva */}
      <div className="intake-controls-card">
        {/* Fila superior para móvil: Buscador principal y botón de alternar filtros */}
        <div className="intake-search-and-mobile-bar">
          <div className="intake-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por atleta, correo, teléfono, país u objetivo..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="intake-clear-input-btn"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                title="Borrar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`intake-mobile-toggle-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
            onClick={() => setIsMobileFiltersOpen(prev => !prev)}
            aria-expanded={isMobileFiltersOpen}
          >
            <SlidersHorizontal size={15} />
            <span>Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
            {isMobileFiltersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Cuadrícula de filtros (siempre visible en desktop, colapsable en móvil) */}
        <div className={`intake-controls-collapsible ${isMobileFiltersOpen ? 'open' : ''}`}>
          <div className="intake-controls-grid">
            {/* 1. Filtro por Fecha / Período */}
            <div className="intake-select-wrapper">
              <Calendar size={15} className="select-icon" />
              <select
                value={dateRangeFilter}
                onChange={e => {
                  setDateRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                title="Filtrar por período o fecha de envío"
              >
                <option value="all">Fecha: Todas las fechas</option>
                <option value="7d">Fecha: Últimos 7 días</option>
                <option value="30d">Fecha: Últimos 30 días</option>
                <option value="2024">Fecha: Año 2024</option>
                <option value="2025_2026">Fecha: Año 2025 - 2026</option>
                <option value="custom">Fecha: Rango personalizado...</option>
              </select>
            </div>

            {/* 2. Filtro por Estado de Verificación */}
            <div className="intake-select-wrapper">
              <CheckCircle2 size={15} className="select-icon" />
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                title="Filtrar por estado de verificación"
              >
                <option value="">Estado: Todos los estados</option>
                <option value="Aprobado y Verificado">Aprobado y Verificado</option>
                <option value="Pendiente de verificación">Pendiente de verificación</option>
              </select>
            </div>

            {/* 3. Filtro por Método de Pago */}
            <div className="intake-select-wrapper">
              <DollarSign size={15} className="select-icon" />
              <select
                value={paymentFilter}
                onChange={e => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                title="Filtrar por método de pago"
              >
                <option value="">Pago: Todos los métodos</option>
                <option value="Sin especificar">Sin especificar</option>
                {uniquePayments.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 4. Filtro por Comprobante */}
            <div className="intake-select-wrapper">
              <FileCheck size={15} className="select-icon" />
              <select
                value={receiptFilter}
                onChange={e => {
                  setReceiptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                title="Filtrar por presencia de comprobante de pago"
              >
                <option value="">Comprobante: Todos</option>
                <option value="with">Con Comprobante Adjunto</option>
                <option value="without">Sin Comprobante</option>
              </select>
            </div>

            {/* 5. Filtro por Género */}
            {uniqueGenders.length > 0 && (
              <div className="intake-select-wrapper">
                <User size={15} className="select-icon" />
                <select
                  value={genderFilter}
                  onChange={e => {
                    setGenderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  title="Filtrar por género"
                >
                  <option value="">Género: Todos</option>
                  {uniqueGenders.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Ordenación */}
            <div className="intake-select-wrapper">
              <ArrowUpDown size={15} className="select-icon" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                title="Ordenar lista"
              >
                <option value="date_desc">Ordenar: Más recientes primero</option>
                <option value="date_asc">Ordenar: Más antiguos primero</option>
                <option value="name_asc">Ordenar: Nombre (A → Z)</option>
                <option value="name_desc">Ordenar: Nombre (Z → A)</option>
              </select>
            </div>
          </div>

          {/* Fila secundaria: Fechas personalizadas (si se activa) + Acciones rápidas */}
          <div className="intake-secondary-controls">
            {dateRangeFilter === 'custom' && (
              <div className="intake-custom-dates-bar">
                <div className="custom-date-field">
                  <span>Desde:</span>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={e => {
                      setCustomDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="custom-date-field">
                  <span>Hasta:</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={e => {
                      setCustomDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="intake-actions-cluster">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="intake-reset-btn"
                  onClick={handleResetFilters}
                  title="Restablecer todos los filtros aplicados"
                >
                  <X size={14} />
                  <span>Limpiar filtros ({activeFiltersCount})</span>
                </button>
              )}

              <button
                type="button"
                className="intake-export-btn"
                onClick={handleExportCSV}
                disabled={filteredAndSorted.length === 0}
                title="Descargar atletas filtrados en formato CSV para Excel o Sheets"
              >
                <Download size={14} />
                <span>Exportar CSV ({filteredAndSorted.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Contenido de Atletas */}
      <div className="intake-table-card">
        <div className="intake-table-header-info">
          <div>
            <h3>
              Respuestas del Formulario de Atletas ({filteredAndSorted.length})
            </h3>
            <p>
              {filteredAndSorted.length === responses.length
                ? `Mostrando ${responses.length} clientes registrados para evaluación`
                : `Mostrando ${filteredAndSorted.length} de ${responses.length} según filtros`}
            </p>
          </div>

          <div className="intake-header-right-badges">
            <span className={`sync-status-badge ${syncBadge.className}`}>
              {syncBadge.text}
            </span>
          </div>
        </div>

        {/* 1. Vista de Tarjetas Móviles (visible en pantallas móviles < 768px) */}
        <div className="intake-mobile-cards-container">
          {paginatedItems.length === 0 ? (
            <div className="empty-state-box">
              <p>No se encontraron respuestas de atletas con los filtros seleccionados.</p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="intake-reset-btn inline"
                  onClick={handleResetFilters}
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          ) : (
            paginatedItems.map((row) => {
              const isVerified = row.estado_pago === 'Aprobado y Verificado';
              const displayDate = row.fecha_display || formatDateDisplay(row.marca_temporal);

              return (
                <div key={`m_${row.id}`} className="intake-mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title-group">
                      <strong className="mobile-athlete-name">{row.nombre_completo}</strong>
                      <div className="mobile-date-sub">
                        <Calendar size={12} />
                        <span>{displayDate}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`status-toggle-chip compact ${isVerified ? 'verified' : 'pending'}`}
                      onClick={() => onUpdateStatus(
                        row.id,
                        isVerified ? 'Pendiente de verificación' : 'Aprobado y Verificado'
                      )}
                      title="Alternar estado de verificación"
                    >
                      {isVerified ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{isVerified ? 'Aprobado' : 'Pendiente'}</span>
                    </button>
                  </div>

                  <div className="mobile-card-meta-grid">
                    {row.pais_ciudad && (
                      <div className="mobile-meta-item">
                        <MapPin size={12} />
                        <span>{row.pais_ciudad}</span>
                      </div>
                    )}
                    {(row.edad || row.genero) && (
                      <div className="mobile-meta-item">
                        <User size={12} />
                        <span>{row.edad ? `${row.edad}a` : ''} {row.genero ? `· ${row.genero}` : ''}</span>
                      </div>
                    )}
                    {row.telefono && (
                      <div className="mobile-meta-item">
                        <Phone size={12} />
                        <span>{row.telefono}</span>
                      </div>
                    )}
                    {row.email && (
                      <div className="mobile-meta-item">
                        <Mail size={12} />
                        <span>{row.email}</span>
                      </div>
                    )}
                  </div>

                  {row.objetivo_principal && (
                    <div className="mobile-goal-box">
                      <span className="goal-label">Objetivo:</span>
                      <p className="mobile-goal-text">{row.objetivo_principal}</p>
                    </div>
                  )}

                  <div className="mobile-card-footer">
                    <div className="mobile-payment-cluster">
                      <span className={`payment-chip ${row.metodo_pago ? 'has-method' : 'no-method'}`}>
                        {row.metodo_pago || 'Sin especificar'}
                      </span>
                      {row.comprobante_url && (
                        <a
                          href={row.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="receipt-preview-link"
                          title="Ver comprobante"
                        >
                          <ExternalLink size={12} />
                          <span>Recibo</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      className="view-dossier-btn mobile-full-btn"
                      onClick={() => onSelectResponse(row)}
                    >
                      <Eye size={14} />
                      <span>Ficha Completa</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Vista de Tabla Completa (visible en pantallas medianas y grandes >= 768px) */}
        <div className="intake-responsive-table">
          <table className="intake-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Fecha Envío</th>
                <th>Atleta</th>
                <th>Ubicación</th>
                <th>Edad / Físico</th>
                <th>Objetivo Principal</th>
                <th>Método de Pago</th>
                <th>Comprobante</th>
                <th style={{ textAlign: 'center' }}>Estado Verificación</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="intake-empty-row">
                    <div className="empty-state-box">
                      <p>No se encontraron respuestas de atletas con los filtros seleccionados.</p>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          className="intake-reset-btn inline"
                          onClick={handleResetFilters}
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => {
                  const isVerified = row.estado_pago === 'Aprobado y Verificado';
                  const displayDate = row.fecha_display || formatDateDisplay(row.marca_temporal);

                  return (
                    <tr key={row.id}>
                      {/* Fecha de Envío corregida y formateada */}
                      <td className="intake-date-cell">
                        <div className="date-flex" title={`Registro original: ${row.marca_temporal || 'N/A'}`}>
                          <Calendar size={14} className="date-icon" />
                          <span className="date-text">{displayDate}</span>
                        </div>
                      </td>

                      {/* Información del Atleta */}
                      <td className="intake-athlete-cell">
                        <div className="athlete-info">
                          <strong className="athlete-name">{row.nombre_completo}</strong>
                          {row.email && <span className="athlete-email">{row.email}</span>}
                          {row.telefono && <span className="athlete-phone">{row.telefono}</span>}
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="intake-location-cell">
                        <div className="location-flex">
                          <MapPin size={13} className="loc-icon" />
                          <span>{row.pais_ciudad || '—'}</span>
                        </div>
                      </td>

                      {/* Edad / Físico */}
                      <td className="intake-body-cell">
                        <div className="body-data-wrapper">
                          <span className="age-gender-text">
                            {row.edad ? `${row.edad} años` : ''}
                            {row.edad && row.genero ? ' · ' : ''}
                            {row.genero || ''}
                            {!row.edad && !row.genero && '—'}
                          </span>
                          {(row.peso_actual_kg || row.estatura_m) && (
                            <div className="body-chips">
                              {row.peso_actual_kg && <span>{row.peso_actual_kg} kg</span>}
                              {row.estatura_m && <span>{row.estatura_m} m</span>}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Objetivo Principal */}
                      <td className="intake-goal-cell">
                        <p className="goal-text" title={row.objetivo_principal}>
                          {row.objetivo_principal || '—'}
                        </p>
                      </td>

                      {/* Método de Pago */}
                      <td>
                        <span className={`payment-chip ${row.metodo_pago ? 'has-method' : 'no-method'}`}>
                          {row.metodo_pago || 'Sin especificar'}
                        </span>
                      </td>

                      {/* Comprobante */}
                      <td className="intake-receipt-cell">
                        {row.comprobante_url ? (
                          <a
                            href={row.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="receipt-preview-link"
                            title="Abrir comprobante de pago en nueva pestaña"
                          >
                            <ExternalLink size={12} />
                            <span>Ver Recibo</span>
                          </a>
                        ) : (
                          <span className="text-muted">Sin comprobante</span>
                        )}
                      </td>

                      {/* Estado de Verificación con toggle */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`status-toggle-chip ${isVerified ? 'verified' : 'pending'}`}
                          onClick={() => onUpdateStatus(
                            row.id,
                            isVerified ? 'Pendiente de verificación' : 'Aprobado y Verificado'
                          )}
                          title={`Estado actual: ${row.estado_pago || 'Pendiente'}. Clic para alternar estado.`}
                        >
                          {isVerified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{isVerified ? 'Aprobado' : 'Pendiente'}</span>
                        </button>
                      </td>

                      {/* Ficha Completa */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="view-dossier-btn"
                          onClick={() => onSelectResponse(row)}
                          title="Ver cuestionario completo (46 respuestas detalladas)"
                        >
                          <Eye size={14} />
                          <span>Ficha Completa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación Unificada */}
        {filteredAndSorted.length > 0 && (
          <div className="intake-pagination-bar">
            <div className="pagination-left">
              <span className="pagination-info">
                {pageSize === 'all' ? (
                  `Todos (${filteredAndSorted.length})`
                ) : (
                  <>
                    {(safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredAndSorted.length)} de {filteredAndSorted.length}
                  </>
                )}
              </span>

              <div className="page-size-selector">
                <span className="desktop-only">Por página:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="pagination-buttons">
                <button
                  type="button"
                  className="page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Página anterior"
                >
                  <ChevronLeft size={16} />
                  <span className="desktop-only">Anterior</span>
                </button>

                <span className="page-indicator">
                  {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  className="page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Página siguiente"
                >
                  <span className="desktop-only">Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
