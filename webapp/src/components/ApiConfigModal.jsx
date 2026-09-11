import React, { useState } from 'react';
import { X, Check, Database, Globe, HelpCircle } from 'lucide-react';
import { getGasWebappUrl, setGasWebappUrl } from '../utils/api';
import { getSupabaseConfig, setSupabaseConfig } from '../utils/supabase';

export default function ApiConfigModal({ isOpen, onClose, onSave }) {
  const currentSupabase = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(currentSupabase.key);
  const [gasUrl, setGasUrl] = useState(getGasWebappUrl());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSupabaseConfig(supabaseUrl, supabaseKey);
    setGasWebappUrl(gasUrl);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSave();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setSupabaseConfig('', '');
    setGasWebappUrl('');
    setSupabaseUrl('');
    setSupabaseKey('');
    setGasUrl('');
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Database size={18} className="text-accent" />
            <h3>Conectar con Supabase & Google Apps Script</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="connection-status-card">
            <div className="status-indicator-row">
              <span className="live-dot-pulse"></span>
              <strong>Google Sheets & Drive: Conectado en Vivo</strong>
            </div>
            <p className="modal-desc" style={{ marginTop: '6px', marginBottom: '0' }}>
              El dashboard está sincronizando automáticamente desde tus dos hojas de cálculo oficiales:
              <br />• <strong>Planes, Clientes & Archivos MD en Drive</strong> (ID: <code>1qURCA...</code>)
              <br />• <strong>Respuestas de Formulario 2 (Intake 46 preguntas)</strong> (ID: <code>11OU8B...</code>)
            </p>
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>URL de Google Apps Script Web App (Conexión Drive & Sheets):</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={e => setGasUrl(e.target.value)}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Por defecto utiliza el endpoint oficial desplegado en tu cuenta.
            </small>
          </div>

          <div className="divider-line" style={{ margin: '18px 0', borderTop: '1px solid var(--border-color)' }}></div>

          <p className="modal-desc">
            <strong>Supabase ("Amazona Fitness") - Opcional:</strong>
            <br />
            Cuando desees activar Supabase, ingresa tus credenciales aquí. Mientras tanto, todos los datos se leen directamente de Google Sheets y Google Drive.
          </p>

          <div className="input-group">
            <label>Supabase Project URL:</label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Supabase Anon Public API Key:</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
            />
          </div>

          <div className="modal-instructions">
            <div className="instruction-head">
              <HelpCircle size={14} />
              <strong>¿Cómo activar Supabase más adelante?</strong>
            </div>
            <ol>
              <li>Entra en tu consola de <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase</a> y crea el proyecto <strong>Amazona Fitness</strong>.</li>
              <li>Ejecuta el archivo <code>supabase/schema.sql</code> en el SQL Editor.</li>
              <li>Pega la Project URL y la anon key aquí.</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn ghost" onClick={handleClear}>
            Restablecer Conexión Oficial
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            {isSaved ? (
              <>
                <Check size={16} />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Configuración</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
