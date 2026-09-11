import React from 'react';
import { Sun, Moon, Database, RefreshCw, Zap, LogOut, User } from 'lucide-react';

export default function Header({
  isDarkMode,
  onToggleTheme,
  isLiveSupabase,
  onOpenSettings,
  onRefresh,
  isLoading,
  currentUser,
  onLogout
}) {
  return (
    <header className="app-header">
      <div className="header-ribbon">
        <div className="ribbon-text">
          <span>Amazona Fitness</span>
          <span className="ribbon-dot">•</span>
          <span>Planes de Nutrición</span>
          <span className="ribbon-dot">•</span>
          <span>Rutinas de Entrenamiento</span>
          <span className="ribbon-dot">•</span>
          <span>Atletas & Intake Supabase</span>
        </div>
      </div>

      <div className="brand-bar">
        <div className="brand-info">
          <div className="brand-badge">
            <Zap size={14} className="brand-badge-icon" />
            <span>SISTEMA PROFESIONAL DE ATLETAS</span>
          </div>
          <h1 className="brand-title">AMAZONA FITNESS</h1>
          <p className="brand-tagline">
            Gestión integral de clientes, intake de cuestionarios, renovaciones y planes individualizados
          </p>
        </div>

        <div className="header-actions">
          {/* Supabase Status Pill */}
          <div
            className={`connection-pill ${isLiveSupabase ? 'live' : 'mock'}`}
            onClick={onOpenSettings}
            title="Haz clic para configurar Supabase o Google Apps Script"
          >
            <Database size={14} />
            <span className="status-label">
              {isLiveSupabase ? 'Supabase Conectado' : 'Modo Demo (Local)'}
            </span>
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

          {/* User profile & logout */}
          {currentUser && (
            <div className="user-profile-widget">
              <div className="user-avatar-pill">
                <User size={14} />
                <span className="user-name-text">{currentUser.name}</span>
              </div>
              <button
                className="action-btn logout-btn"
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
