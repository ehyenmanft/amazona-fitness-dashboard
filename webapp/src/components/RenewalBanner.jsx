import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDateES } from '../utils/renewals';

export default function RenewalBanner({ renewals, onSelectClient }) {
  if (!renewals || renewals.length === 0) {
    return (
      <section className="renewal-section empty">
        <div className="renewal-header">
          <div className="renewal-title-box">
            <CheckCircle2 size={18} className="text-ok" />
            <h3>Renovaciones de Clientes</h3>
            <span className="renewal-window-badge">Rango ±10 días</span>
          </div>
          <span className="renewal-clean-status">Todos los clientes al día en este ciclo</span>
        </div>
      </section>
    );
  }

  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 10);
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + 10);

  return (
    <section className="renewal-section">
      <div className="renewal-header">
        <div className="renewal-title-box">
          <AlertCircle size={18} className="text-accent" />
          <h3>Clientes Próximos a Renovar</h3>
          <span className="renewal-window-badge">
            {formatDateES(windowStart)} al {formatDateES(windowEnd)}
          </span>
        </div>
        <span className="renewal-count-badge">
          {renewals.length} cliente{renewals.length === 1 ? '' : 's'} en ventana crítica
        </span>
      </div>

      <div className="renewal-cards-grid">
        {renewals.map(item => {
          let urgency = 'normal';
          let statusLabel = '';
          if (item.daysLeft < 0) {
            urgency = 'expired';
            statusLabel = `Vencido hace ${Math.abs(item.daysLeft)} d`;
          } else if (item.daysLeft === 0) {
            urgency = 'urgent';
            statusLabel = '¡Renueva hoy!';
          } else if (item.daysLeft <= 3) {
            urgency = 'urgent';
            statusLabel = `En ${item.daysLeft} día${item.daysLeft === 1 ? '' : 's'}`;
          } else {
            urgency = 'upcoming';
            statusLabel = `En ${item.daysLeft} días`;
          }

          return (
            <div
              key={item.client}
              className={`renewal-card-item ${urgency}`}
              onClick={() => onSelectClient(item.client)}
              role="button"
              tabIndex={0}
            >
              <div className="card-top">
                <span className="client-name">{item.client}</span>
                <span className={`status-pill ${urgency}`}>{statusLabel}</span>
              </div>

              <div className="card-renewal-date">
                <Calendar size={15} />
                <span>{item.renewalText}</span>
              </div>

              <div className="card-meta">
                <span>Último: {formatDateES(item.lastPlanDate)} {item.lastPlanMonth ? `(${item.lastPlanMonth})` : ''}</span>
                <span>Frecuencia: {item.frequency} días</span>
              </div>

              <div className="card-action">
                <span>Ver ficha y plan</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
