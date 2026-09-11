import React, { useState } from 'react';
import {
  X, User, Target, Dumbbell, Salad, HeartPulse, CreditCard,
  ExternalLink, CheckCircle2, Clock, MapPin, Phone, Mail, Calendar
} from 'lucide-react';

export default function IntakeDetailModal({
  athlete,
  onClose,
  onUpdateStatus
}) {
  const [activeTab, setActiveTab] = useState('personal');

  if (!athlete) return null;

  const isVerified = athlete.estado_pago === 'Aprobado y Verificado';

  const tabs = [
    { id: 'personal', label: 'Datos & Medidas', icon: User },
    { id: 'goals', label: 'Objetivos & Metas', icon: Target },
    { id: 'training', label: 'Entrenamiento & Rutina', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrición & Hábitos', icon: Salad },
    { id: 'health', label: 'Salud & Suplementos', icon: HeartPulse },
    { id: 'payment', label: 'Pago & Comprobante', icon: CreditCard }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dossier-modal-box" onClick={e => e.stopPropagation()}>
        {/* Encabezado de la Ficha del Atleta */}
        <div className="dossier-header">
          <div className="dossier-hero">
            <div className="athlete-avatar">
              {athlete.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <div className="athlete-header-meta">
              <div className="athlete-title-row">
                <h2>{athlete.nombre_completo}</h2>
                <span className={`status-badge-hero ${isVerified ? 'verified' : 'pending'}`}>
                  {athlete.estado_pago || 'Pendiente de verificación'}
                </span>
              </div>
              <div className="athlete-contact-chips">
                {athlete.email && (
                  <span className="contact-chip">
                    <Mail size={12} />
                    <span>{athlete.email}</span>
                  </span>
                )}
                {athlete.telefono && (
                  <span className="contact-chip">
                    <Phone size={12} />
                    <span>{athlete.telefono}</span>
                  </span>
                )}
                {athlete.pais_ciudad && (
                  <span className="contact-chip">
                    <MapPin size={12} />
                    <span>{athlete.pais_ciudad}</span>
                  </span>
                )}
                <span className="contact-chip">
                  <Calendar size={12} />
                  <span>Enviado: {new Date(athlete.marca_temporal || athlete.created_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Barra de pestañas de la ficha */}
        <div className="dossier-tabs-bar">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`dossier-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido por pestaña */}
        <div className="dossier-body">
          {activeTab === 'personal' && (
            <div className="dossier-grid">
              <FieldCard label="Nombre Completo" value={athlete.nombre_completo} />
              <FieldCard label="Edad" value={athlete.edad ? `${athlete.edad} años` : '—'} />
              <FieldCard label="Género" value={athlete.genero} />
              <FieldCard label="País y Ciudad de Residencia" value={athlete.pais_ciudad} />
              <FieldCard label="Estatura (metros)" value={athlete.estatura_m ? `${athlete.estatura_m} m` : '—'} />
              <FieldCard label="Peso Actual" value={athlete.peso_actual_kg ? `${athlete.peso_actual_kg} kg` : '—'} />
              <FieldCard label="Peso Ideal o Meta" value={athlete.peso_ideal_kg ? `${athlete.peso_ideal_kg} kg` : '—'} />
              <FieldCard label="Correo Electrónico" value={athlete.email || athlete.email_direccion} />
              <FieldCard label="Teléfono de Contacto" value={athlete.telefono} />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="dossier-grid">
              <FieldCard full label="¿Cuál es tu objetivo principal?" value={athlete.objetivo_principal} highlight />
              <FieldCard label="Nivel de Importancia (1 al 10)" value={athlete.importancia_objetivo ? `${athlete.importancia_objetivo} / 10` : '—'} />
              <FieldCard label="Fecha límite o meta de tiempo" value={athlete.fecha_limite} />
              <FieldCard full label="¿Qué te motiva a alcanzar este objetivo?" value={athlete.motivacion} />
              <FieldCard full label="Objetivos específicos adicionales" value={athlete.objetivos_especificos} />
            </div>
          )}

          {activeTab === 'training' && (
            <div className="dossier-grid">
              <FieldCard label="Disciplina Deportiva" value={athlete.disciplina_deportiva} />
              <FieldCard label="Nivel de Experiencia" value={athlete.nivel_experiencia} />
              <FieldCard label="Días dispuesta/o a entrenar" value={athlete.dias_entrenamiento} highlight />
              <FieldCard label="Experiencia previa con pesas/máquinas" value={athlete.experiencia_pesas} />
              <FieldCard label="¿Realizas algún deporte regularmente?" value={athlete.deporte_regular} />
              <FieldCard label="Acceso a gimnasio o entrena en casa" value={athlete.lugar_entrenamiento} />
              <FieldCard full label="Equipo disponible en casa" value={athlete.equipo_casa} />
              <FieldCard label="Tiempo disponible por sesión" value={athlete.tiempo_ejercicio} />
              <FieldCard full label="Tipo de ejercicio que realiza actualmente" value={athlete.tipo_ejercicio_actual} />
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="dossier-grid">
              <FieldCard label="Tipo de Dieta Actual" value={athlete.dieta_actual} />
              <FieldCard label="Horas de sueño por noche" value={athlete.horas_sueno} />
              <FieldCard label="Nivel de Estrés" value={athlete.nivel_estres} />
              <FieldCard label="Consumo de agua diario" value={athlete.consumo_agua_litros} />
              <FieldCard label="Consumo de café o energéticas" value={athlete.consumo_cafe} />
              <FieldCard full label="Alergias o intolerancias alimenticias" value={athlete.alergias_alimenticias} />
              <FieldCard full label="Alimentos que prefieres evitar" value={athlete.alimentos_evitar} />
              <FieldCard full label="Alimentos que prefieres incluir" value={athlete.alimentos_preferidos} highlight />
              <FieldCard full label="Horarios específicos para comidas principales" value={athlete.horarios_comidas} />
              <FieldCard full label="Comodidad al reducir carbohidratos o grasas" value={athlete.reduccion_macros_comodo} />
            </div>
          )}

          {activeTab === 'health' && (
            <div className="dossier-grid">
              <FieldCard full label="Condición médica diagnosticada" value={athlete.condicion_medica} />
              <FieldCard label="Medicamentos regulares" value={athlete.medicamentos} />
              <FieldCard label="Tratamiento médico / fisioterapia actual" value={athlete.tratamiento_medico} />
              <FieldCard full label="Problemas con entrenamientos previos" value={athlete.problemas_previos} />
              <FieldCard full label="Lesión o condición actual a considerar" value={athlete.lesion_condicion} highlight />
              <FieldCard full label="Suplementos que utilizas actualmente" value={athlete.suplementos_actuales} />
              <FieldCard label="Interés en recomendaciones de suplementos" value={athlete.interes_suplementacion} />
              <FieldCard label="Alergia a algún suplemento" value={athlete.alergia_suplementos} />
              <FieldCard label="Consentimiento para testimonios" value={athlete.consentimiento_testimonios} />
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="dossier-grid">
              <FieldCard label="Método de Pago Utilizado" value={athlete.metodo_pago} highlight />
              <FieldCard label="Estado de Verificación" value={athlete.estado_pago} />

              <div className="dossier-full-field receipt-card-wrap">
                <span className="field-label">Comprobante de Pago Adjunto</span>
                {athlete.comprobante_url ? (
                  <div className="receipt-view-box">
                    <a
                      href={athlete.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="receipt-open-btn"
                    >
                      <ExternalLink size={16} />
                      <span>Abrir Comprobante en pestaña nueva</span>
                    </a>
                  </div>
                ) : (
                  <p className="no-receipt-text">No se adjuntó archivo de comprobante.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie de la Ficha con botones de acción */}
        <div className="dossier-footer">
          <div className="dossier-status-actions">
            <button
              type="button"
              className={`dossier-action-btn ${isVerified ? 'outline' : 'approve'}`}
              onClick={() => onUpdateStatus(athlete.id, isVerified ? 'Pendiente de verificación' : 'Aprobado y Verificado')}
            >
              {isVerified ? (
                <>
                  <Clock size={16} />
                  <span>Marcar como Pendiente</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Aprobar y Verificar Pago</span>
                </>
              )}
            </button>
          </div>

          <button className="dossier-action-btn close" onClick={onClose}>
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldCard({ label, value, full, highlight }) {
  return (
    <div className={`dossier-field-card ${full ? 'col-span-full' : ''} ${highlight ? 'highlight' : ''}`}>
      <span className="field-label">{label}</span>
      <p className="field-val">{value || '—'}</p>
    </div>
  );
}
