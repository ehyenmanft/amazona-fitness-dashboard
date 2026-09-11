import React from 'react';
import { ClipboardList, User, Table, Menu } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  intakeCount = 0,
  onOpenSidebar
}) {
  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`bottom-nav-btn ${activeTab === 'table' ? 'active' : ''}`}
        onClick={() => onTabChange('table')}
      >
        <div className="bottom-nav-icon-wrap">
          <Table size={20} />
        </div>
        <span>Planes</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-btn ${activeTab === 'intake' ? 'active' : ''}`}
        onClick={() => onTabChange('intake')}
      >
        <div className="bottom-nav-icon-wrap">
          <ClipboardList size={20} />
          {intakeCount > 0 && (
            <span className="bottom-nav-badge">{intakeCount}</span>
          )}
        </div>
        <span>Intake</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-btn ${activeTab === 'client' ? 'active' : ''}`}
        onClick={() => onTabChange('client')}
      >
        <div className="bottom-nav-icon-wrap">
          <User size={20} />
        </div>
        <span>Ficha</span>
      </button>

      <button
        type="button"
        className="bottom-nav-btn menu-trigger"
        onClick={onOpenSidebar}
        title="Abrir menú y opciones"
      >
        <div className="bottom-nav-icon-wrap">
          <Menu size={20} />
        </div>
        <span>Menú</span>
      </button>
    </nav>
  );
}
