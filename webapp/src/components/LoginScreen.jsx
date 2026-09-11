import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { loginUser } from '../utils/auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await loginUser(email, password);
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message);
    }
  };


  return (
    <div className="login-viewport">
      <div className="login-card-container">
        {/* Encabezado con Branding */}
        <div className="login-header">
          <div className="login-badge">
            <Zap size={13} />
            <span>ACCESO EXCLUSIVO COACHES</span>
          </div>
          <h1 className="login-title">AMAZONA FITNESS</h1>
          <p className="login-subtitle">Dashboard de Control de Atletas & Planes</p>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="login-error-banner">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="login-field-group">
            <label>Correo Electrónico</label>
            <div className="login-input-wrap">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field-group">
            <label>Contraseña de Acceso</label>
            <div className="login-input-wrap">
              <Lock size={16} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            <ShieldCheck size={18} />
            <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
          </button>
        </form>


        <div className="login-footer">
          <span>Amazona Fitness · Plataforma Privada de Gestión Deportiva</span>
        </div>
      </div>
    </div>
  );
}
