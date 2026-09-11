import React from 'react';
import { Sun, Moon, Link2, RefreshCw, Zap } from 'lucide-react';

export default function Header({ isDarkMode, onToggleTheme, isLive, onOpenSettings, onRefresh, isLoading }) {
  return (
    <header className="app-header">
      <div className="header-ribbon">
        <div className="ribbon-text">
          <span>Plan personalizado</span>
          <span className="ribbon-dot">•</span>
          <span>Nutrición & Macros</span>
          <span className="ribbon-dot">•</span>
          <span>Suplementación</span>
          <span className="ribbon-dot">•</span>
          <span>Estilo de vida & Rendimiento</span>
        </div>
      </div>

      <div className="brand-bar">
        <div className="brand-info">
          <div className="brand-badge">
            <Zap size={14} className="brand-badge-icon" />
            <span>SISTEMA DE GESTIÓN DE PLANES</span>
          </div>
          <h1 className="brand-title">AMAZONA FITNESS</h1>
          <p className="brand-tagline">
            Gestión integral de clientes, renovaciones periódicas, planes en PDF y Data estructurada en Drive
          </p>
        </div>

        <div className="header-actions">
          <div
            className={`connection-pill ${isLive ? 'live' : 'mock'}`}
            onClick={onOpenSettings}
            title="Haz clic para configurar la URL de Google Apps Script"
          >
            <span className="status-indicator"></span>
            <span className="status-label">{isLive ? 'Conectado a Google Sheets' : 'Modo Demostración'}</span>
            <Link2 size={13} className="pill-icon" />
          </div>

          <button
            className="action-btn icon-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>

          <button
            className="action-btn theme-btn"
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDarkMode ? 'Modo Día' : 'Modo Noche'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
