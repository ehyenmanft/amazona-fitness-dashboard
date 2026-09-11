import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Eye, CheckCircle2, Clock, ExternalLink,
  ChevronRight, Calendar, User, DollarSign, MapPin, Activity
} from 'lucide-react';
import { normalize } from '../utils/planParser';

export default function IntakeListView({
  responses,
  onSelectResponse,
  onUpdateStatus,
  isLiveSupabase
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(searchTerm.trim());
    return (responses || []).filter(item => {
      if (statusFilter && item.estado_pago !== statusFilter) return false;
      if (paymentFilter && item.metodo_pago !== paymentFilter) return false;

      if (q) {
        const textToSearch = [
          item.nombre_completo,
          item.email,
          item.telefono,
          item.pais_ciudad,
          item.objetivo_principal
        ].join(' ');
        if (!normalize(textToSearch).includes(q)) return false;
      }
      return true;
    });
  }, [responses, searchTerm, statusFilter, paymentFilter]);

  const uniquePayments = Array.from(
    new Set(responses.map(r => r.metodo_pago).filter(Boolean))
  );

  return (
    <section className="intake-list-section">
      {/* Controles de Filtros */}
      <div className="intake-controls-bar">
        <div className="intake-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por atleta, correo, teléfono, país u objetivo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Estado de Pago: Todos</option>
          <option value="Aprobado y Verificado">Aprobado y Verificado</option>
          <option value="Pendiente de verificación">Pendiente de verificación</option>
        </select>

        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
        >
          <option value="">Método de Pago: Todos</option>
          {uniquePayments.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Tabla de Atletas del Formulario */}
      <div className="intake-table-card">
        <div className="intake-table-header-info">
          <div>
            <h3>Respuestas del Formulario de Atletas ({filtered.length})</h3>
            <p>Datos sincronizados de todos los clientes registrados para evaluación</p>
          </div>
          <span className={`sync-status-badge ${isLiveSupabase ? 'live' : 'demo'}`}>
            {isLiveSupabase ? 'Sincronizado con Supabase' : 'Modo Demo / Sin conexión'}
          </span>
        </div>

        <div className="intake-responsive-table">
          <table className="intake-table">
            <thead>
              <tr>
                <th>Fecha Envío</th>
                <th>Atleta</th>
                <th>Ubicación</th>
                <th>Edad / Físico</th>
                <th>Objetivo Principal</th>
                <th>Método de Pago</th>
                <th>Comprobante</th>
                <th>Estado Verificación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="intake-empty-row">
                    No se encontraron respuestas de atletas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isVerified = row.estado_pago === 'Aprobado y Verificado';
                  return (
                    <tr key={row.id}>
                      <td className="intake-date-cell">
                        <div className="date-flex">
                          <Calendar size={13} />
                          <span>{new Date(row.marca_temporal || row.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="intake-athlete-cell">
                        <div className="athlete-info">
                          <strong>{row.nombre_completo}</strong>
                          <span className="athlete-email">{row.email || row.email_direccion}</span>
                          <span className="athlete-phone">{row.telefono}</span>
                        </div>
                      </td>

                      <td className="intake-location-cell">
                        <div className="location-flex">
                          <MapPin size={13} />
                          <span>{row.pais_ciudad || '—'}</span>
                        </div>
                      </td>

                      <td className="intake-body-cell">
                        <div>
                          <span>{row.edad ? `${row.edad} años` : ''} · {row.genero}</span>
                          <div className="body-chips">
                            {row.peso_actual_kg && <span>{row.peso_actual_kg} kg</span>}
                            {row.estatura_m && <span>{row.estatura_m} m</span>}
                          </div>
                        </div>
                      </td>

                      <td className="intake-goal-cell">
                        <p className="goal-text" title={row.objetivo_principal}>
                          {row.objetivo_principal}
                        </p>
                      </td>

                      <td>
                        <span className="payment-chip">{row.metodo_pago || 'No especificado'}</span>
                      </td>

                      <td className="intake-receipt-cell">
                        {row.comprobante_url ? (
                          <a
                            href={row.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="receipt-preview-link"
                          >
                            <ExternalLink size={12} />
                            <span>Ver Recibo</span>
                          </a>
                        ) : (
                          <span className="text-muted">Sin comprobante</span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`status-toggle-chip ${isVerified ? 'verified' : 'pending'}`}
                          onClick={() => onUpdateStatus(row.id, isVerified ? 'Pendiente de verificación' : 'Aprobado y Verificado')}
                          title="Clic para cambiar estado"
                        >
                          {isVerified ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{isVerified ? 'Aprobado' : 'Pendiente'}</span>
                        </button>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-dossier-btn"
                          onClick={() => onSelectResponse(row)}
                          title="Ver cuestionario completo (46 respuestas)"
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
      </div>
    </section>
  );
}
