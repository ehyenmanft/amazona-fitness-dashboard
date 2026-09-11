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

        {/* Lado derecho: Acciones en el cintillo superior (Sincronización y Modo Claro/Oscuro) */}
        <div className="header-actions">
          {/* Botón de Sincronización en Vivo */}
          <button
            type="button"
            className={`sync-header-btn ${isLiveGAS || isLiveSupabase ? 'live' : 'mock'}`}
            onClick={onRefresh}
            disabled={isLoading}
            title={isLiveGAS ? 'Sincronizado con Google Drive & Sheets. Clic para recargar.' : isLiveSupabase ? 'Sincronizado con Supabase. Clic para recargar.' : 'Modo local. Clic para recargar.'}
          >
            <span className={`sync-pulse-dot ${isLiveGAS || isLiveSupabase ? 'live' : 'mock'}`} />
            <RefreshCw size={15} className={`sync-icon ${isLoading ? 'spin' : ''}`} />
            <span className="sync-btn-label desktop-only">
              {isLoading ? 'Recargando...' : isLiveGAS ? 'Google Sheets' : 'Sincronizar'}
            </span>
          </button>

          {/* Botón de Modo Claro / Oscuro */}
          <button
            type="button"
            className="theme-toggle-header-btn"
            onClick={onToggleTheme}
            aria-label="Cambiar tema claro u oscuro"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <Sun size={17} className="text-sun" /> : <Moon size={17} className="text-moon" />}
            <span className="theme-btn-label desktop-only">
              {isDarkMode ? 'Modo Día' : 'Modo Noche'}
            </span>
          </button>

          {/* Acceso a Configuración */}
          <button
            type="button"
            className="header-config-btn"
            onClick={onOpenSettings}
            title="Configurar conexiones Google Drive, Sheets y Supabase"
            aria-label="Configuración de conexiones"
          >
            <Settings size={16} />
          </button>

          {/* Perfil de Usuario en Escritorio */}
          {currentUser && (
            <div className="user-profile-widget desktop-only">
              <div className="user-avatar-pill">
                <User size={14} />
                <span className="user-name-text">{currentUser.name}</span>
              </div>
              <button
                type="button"
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
