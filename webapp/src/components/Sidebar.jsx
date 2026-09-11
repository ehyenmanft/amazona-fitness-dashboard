import React from 'react';
import {
  ClipboardList, User, Table, Bell, Settings, RefreshCw,
  Sun, Moon, LogOut, Zap, X, ShieldCheck, Database, ChevronRight
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  intakeCount = 0,
  plansCount = 0,
  renewalsCount = 0,
  isLiveGAS,
  isLiveSupabase,
  onOpenSettings,
  onRefresh,
  isLoading,
  isDarkMode,
  onToggleTheme,
  currentUser,
  onLogout
}) {
  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    if (onClose) onClose();
  };

  const navItems = [
    {
      id: 'intake',
      label: 'Respuestas Formulario',
      sublabel: 'Intake de Atletas',
      icon: ClipboardList,
      badge: intakeCount,
      badgeClass: 'badge-fuchsia'
    },
    {
      id: 'client',
      label: 'Ficha del Atleta',
      sublabel: 'Visor y Data Markdown',
      icon: User,
      badge: null
    },
    {
      id: 'table',
      label: 'Tabla de Planes',
      sublabel: 'Control de Archivos',
      icon: Table,
      badge: plansCount,
      badgeClass: 'badge-default'
    }
  ];

  return (
    <>
      {/* Backdrop para cerrar el menú en móviles */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar-aside ${isOpen ? 'open' : ''}`}>
        {/* Cabecera del Menú Lateral */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Zap size={20} />
            </div>
            <div className="brand-titles">
              <h2 className="brand-name">AMAZONA</h2>
              <span className="brand-sub">FITNESS DASHBOARD</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar menú lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Estado de Conexión */}
        <div className="sidebar-sync-card">
          <div className="sync-card-info">
            <div className={`status-indicator-dot ${isLiveGAS || isLiveSupabase ? 'live' : 'mock'}`} />
            <div className="sync-text-group">
              <span className="sync-source">
                {isLiveGAS ? 'Google Drive & Sheets' : isLiveSupabase ? 'Supabase' : 'Modo Local / Demo'}
              </span>
              <span className="sync-status">
                {isLiveGAS || isLiveSupabase ? 'Sincronizado en Vivo' : 'Sin conexión activa'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar datos ahora"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        {/* Navegación Principal */}
        <div className="sidebar-section-label">NAVEGACIÓN PRINCIPAL</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <div className="nav-item-icon">
                  <Icon size={18} />
                </div>
                <div className="nav-item-content">
                  <span className="nav-item-title">{item.label}</span>
                  <span className="nav-item-sub">{item.sublabel}</span>
                </div>
                {item.badge !== null && (
                  <span className={`nav-item-badge ${item.badgeClass || ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Resumen de Renovaciones */}
        {renewalsCount > 0 && (
          <div className="sidebar-alert-card">
            <div className="alert-card-header">
              <Bell size={15} className="alert-icon" />
              <span>Renovaciones Próximas</span>
            </div>
            <p className="alert-card-desc">
              Tienes <strong>{renewalsCount}</strong> clientes con plan por vencer en los próximos 7 días.
            </p>
          </div>
        )}

        {/* Acciones y Configuración en la parte inferior */}
        <div className="sidebar-footer">
          <div className="sidebar-actions-grid">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={() => {
                onOpenSettings();
                if (onClose) onClose();
              }}
              title="Configurar Google Apps Script y Supabase"
            >
              <Settings size={16} />
              <span>Configuración</span>
            </button>

            <button
              type="button"
              className="sidebar-action-btn"
              onClick={onToggleTheme}
              title={isDarkMode ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? 'Modo Día' : 'Modo Noche'}</span>
            </button>
          </div>

          {/* Perfil del Usuario */}
          {currentUser && (
            <div className="sidebar-user-card">
              <div className="user-avatar-circle">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="user-info-text">
                <strong className="user-name">{currentUser.name || 'Entrenador'}</strong>
                <span className="user-role">Amazona Fitness Coach</span>
              </div>
              <button
                type="button"
                className="user-logout-btn"
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
