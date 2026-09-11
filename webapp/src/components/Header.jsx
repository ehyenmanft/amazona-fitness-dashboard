import React from 'react';
import {
  Sun, Moon, Database, RefreshCw, Zap, LogOut, User, Menu, Settings
} from 'lucide-react';

export default function Header({
  isDarkMode,
  onToggleTheme,
  isLiveGAS,
  isLiveSupabase,
  onOpenSettings,
  onRefresh,
  isLoading,
  currentUser,
  onLogout,
  onOpenSidebar,
  activeTab
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'intake':
        return 'Intake Atletas';
      case 'client':
        return 'Ficha Atleta';
      case 'table':
        return 'Tabla Planes';
      default:
        return 'Panel';
    }
  };

  return (
    <header className="app-header">
      <div className="brand-bar">
        {/* Lado izquierdo: Botón Menú Móvil + Títulos */}
        <div className="header-left-group">
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={onOpenSidebar}
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="brand-info">
            <div className="brand-badge">
              <Zap size={12} className="brand-badge-icon" />
              <span className="desktop-only">SISTEMA PROFESIONAL DE ATLETAS</span>
              <span className="mobile-only">AMAZONA · {getTabTitle()}</span>
            </div>
            <h1 className="brand-title desktop-only">AMAZONA FITNESS</h1>
            <p className="brand-tagline desktop-only">
              Gestión integral de clientes, intake de cuestionarios, renovaciones y planes individualizados
            </p>
          </div>
        </div>

        {/* Lado derecho: Acciones rápidas */}
        <div className="header-actions">
          {/* Connection Status Pill */}
          <div
            className={`connection-pill ${isLiveGAS || isLiveSupabase ? 'live' : 'mock'}`}
            onClick={onOpenSettings}
            title="Haz clic para ver o configurar conexiones de Google Drive, Sheets y Supabase"
          >
            <Database size={14} />
            <span className="status-label desktop-only">
              {isLiveGAS ? 'Google Drive & Sheets' : isLiveSupabase ? 'Supabase' : 'Modo Local'}
            </span>
          </div>

          <button
            className="action-btn icon-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar datos desde Google Drive y Sheets"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>

          <button
            className="action-btn theme-btn"
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            title={isDarkMode ? 'Modo Día' : 'Modo Noche'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="desktop-only">{isDarkMode ? 'Día' : 'Noche'}</span>
          </button>

          {/* User profile & logout */}
          {currentUser && (
            <div className="user-profile-widget desktop-only">
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
