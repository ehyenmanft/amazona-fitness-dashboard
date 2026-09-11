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
          <p className="modal-desc">
            Configura la conexión con tu proyecto de <strong>Supabase</strong> ("Amazona Fitness")
            para almacenar y leer las respuestas de tus atletas en tiempo real.
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

          <div className="input-group">
            <label>URL de Google Apps Script Web App (Opcional):</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={e => setGasUrl(e.target.value)}
            />
          </div>

          <div className="modal-instructions">
            <div className="instruction-head">
              <HelpCircle size={14} />
              <strong>Pasos para configurar Supabase:</strong>
            </div>
            <ol>
              <li>Entra en tu consola de <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase</a>.</li>
              <li>Crea el proyecto <strong>Amazona Fitness</strong> (o entra si ya existe).</li>
              <li>Ve a <strong>Project Settings &gt; API</strong> y copia la <em>Project URL</em> y <em>anon public key</em>.</li>
              <li>En el <strong>SQL Editor</strong> de Supabase, ejecuta el script <code>supabase/schema.sql</code> que hemos incluido en el repositorio.</li>
            </ol>
            <p className="instruction-note">
              Si dejas estos campos vacíos, el dashboard seguirá funcionando fluidamente con datos de demostración predefinidos.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn ghost" onClick={handleClear}>
            Restablecer / Modo Demo
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            {isSaved ? (
              <>
                <Check size={16} />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Conexión</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
