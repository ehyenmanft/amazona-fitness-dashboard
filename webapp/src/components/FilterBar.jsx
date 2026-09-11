import React from 'react';
import { Search, X, RotateCcw, User, Table, ClipboardList } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  clientFilter,
  onClientFilterChange,
  monthFilter,
  onMonthFilterChange,
  statusFilter,
  onStatusFilterChange,
  mdFilter,
  onMdFilterChange,
  uniqueClients,
  activeTab,
  onTabChange,
  onResetFilters,
  resultCount,
  intakeCount
}) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <section className="filter-panel">
      <div className="filter-controls-grid">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en planes, clientes, notas..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={clientFilter}
          onChange={e => onClientFilterChange(e.target.value)}
        >
          <option value="">Todos los atletas ({uniqueClients.length})</option>
          {uniqueClients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={e => onMonthFilterChange(e.target.value)}
        >
          <option value="">Todos los meses</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="PDF+MD">PDF + Data</option>
          <option value="PDF sin MD exacto">PDF sin Data exacta</option>
          <option value="MD solo">Data sola</option>
          <option value="Sin plan">Sin plan</option>
        </select>

        <select
          value={mdFilter}
          onChange={e => onMdFilterChange(e.target.value)}
        >
          <option value="">Filtro Data: Todos</option>
          <option value="Sí">Con Data (.md)</option>
          <option value="No">Sin Data</option>
        </select>
      </div>

      <div className="filter-footer">
        <div className="view-tabs">
          <button
            className={`tab-btn ${activeTab === 'intake' ? 'active' : ''}`}
            onClick={() => onTabChange('intake')}
          >
            <ClipboardList size={16} />
            <span>Atletas del Formulario ({intakeCount || 0})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => onTabChange('client')}
          >
            <User size={16} />
            <span>Ficha Atleta + Data de Plan</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => onTabChange('table')}
          >
            <Table size={16} />
            <span>Tabla de Planes</span>
          </button>
        </div>

        <div className="filter-meta">
          <span className="results-counter">{resultCount} registros encontrados</span>
          <button className="reset-btn" onClick={onResetFilters} title="Restablecer filtros">
            <RotateCcw size={13} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </section>
  );
}
