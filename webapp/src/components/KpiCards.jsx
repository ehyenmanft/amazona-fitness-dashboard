import React from 'react';
import { Users, FileSpreadsheet, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function KpiCards({ summary, onFilterStatus }) {
  if (!summary) return null;

  const cards = [
    {
      label: 'Clientes Activos',
      value: summary.clientsCount ?? 0,
      icon: Users,
      color: '#3b82f6',
      sub: 'Base de atletas',
      action: () => {}
    },
    {
      label: 'Planes Totales',
      value: summary.plansCount ?? 0,
      icon: FileSpreadsheet,
      color: '#f97316',
      sub: 'Histórico generado',
      action: () => {}
    },
    {
      label: 'Data de Plan',
      value: summary.mdFilesCount ?? 0,
      icon: FileCode,
      color: '#8b5cf6',
      sub: 'Archivos .md Drive',
      action: () => {}
    },
    {
      label: 'PDF + Data Completa',
      value: summary.pdfMdCount ?? 0,
      icon: CheckCircle2,
      color: '#10b981',
      sub: summary.plansCount ? `${Math.round((summary.pdfMdCount / summary.plansCount) * 100)}% sincronizado` : '100%',
      filterStatus: 'PDF+MD'
    },
    {
      label: 'Pendientes de Data',
      value: summary.missingMdCount ?? 0,
      icon: AlertTriangle,
      color: '#ef4444',
      sub: 'Requiere digitalización',
      filterStatus: 'PDF sin MD exacto'
    }
  ];

  return (
    <section className="kpi-cards-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`kpi-card ${card.filterStatus ? 'clickable' : ''}`}
            onClick={() => card.filterStatus && onFilterStatus && onFilterStatus(card.filterStatus)}
          >
            <div className="kpi-top">
              <span className="kpi-label">{card.label}</span>
              <div className="kpi-icon-wrap" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                <Icon size={18} />
              </div>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
          </div>
        );
      })}
    </section>
  );
}
