import React, { useState } from 'react';
import { X, Check, Globe, HelpCircle } from 'lucide-react';
import { getGasWebappUrl, setGasWebappUrl } from '../utils/api';

export default function ApiConfigModal({ isOpen, onClose, onSave }) {
  const [url, setUrl] = useState(getGasWebappUrl());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGasWebappUrl(url);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSave();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setUrl('');
    setGasWebappUrl('');
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Globe size={18} className="text-accent" />
            <h3>Conectar con Google Apps Script</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Introduce la URL de implementación de la Web App de Google Apps Script para sincronizar
            los datos en tiempo real desde Google Sheets y Google Drive.
          </p>

          <div className="input-group">
            <label>URL de la Web App (exec):</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div className="modal-instructions">
            <div className="instruction-head">
              <HelpCircle size={14} />
              <strong>¿Cómo obtener esta URL en Google Apps Script?</strong>
            </div>
            <ol>
              <li>Abre el proyecto en Google Apps Script.</li>
              <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
              <li>Selecciona tipo <strong>Aplicación web</strong>.</li>
              <li>Configura: <em>Ejecutar como:</em> <strong>Yo</strong>, y <em>Quién tiene acceso:</em> <strong>Cualquier usuario</strong>.</li>
              <li>Copia la URL que termina en <code>/exec</code> y pégala arriba.</li>
            </ol>
            <p className="instruction-note">
              Si dejas este campo vacío, la aplicación funcionará de manera autónoma con los datos de demostración predefinidos.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn ghost" onClick={handleClear}>
            Usar Datos Demo
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            {isSaved ? (
              <>
                <Check size={16} />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Conectar y Sincronizar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
