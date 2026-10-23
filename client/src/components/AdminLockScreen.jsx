import React, { useState } from 'react';
import { 
  Unlock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Tv, 
  CheckCircle2,
  BadgeCheck,
  Loader2,
  Sparkles,
  Globe
} from 'lucide-react';
import { validarDistribuidorEnSupabase, authenticateAdmin } from '../utils/auth';

export function AdminLockScreen({ onUnlock, onGoToPortal }) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [welcomeDistributor, setWelcomeDistributor] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingresa tu código único de distribuidor (DIST-XXXX).');
      triggerShake();
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const result = await validarDistribuidorEnSupabase(code);

      if (result.success && result.distributor) {
        setWelcomeDistributor(result.distributor);
        setIsSuccess(true);
        authenticateAdmin(rememberMe, result.distributor);
        setTimeout(() => {
          onUnlock(result.distributor);
        }, 700);
      } else {
        setError(result.error || 'Código de distribuidor incorrecto o suspendido.');
        triggerShake();
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      triggerShake();
    } finally {
      setIsValidating(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  return (
    <div className="admin-lock-screen">
      {/* Fondo con Luces Ambientales y Malla */}
      <div className="lock-bg-effects">
        <div className="lock-ambient-orb orb-1" />
        <div className="lock-ambient-orb orb-2" />
        <div className="lock-ambient-orb orb-3" />
        <div className="lock-grid-overlay" />
      </div>

      <div className="lock-content-wrapper">
        {/* Tarjeta Bóveda */}
        <div className={`lock-card ${isShaking ? 'shake-animation' : ''} ${isSuccess ? 'success-animation' : ''}`}>
          
          {/* Header de la Bóveda */}
          <div className="lock-card-header">
            <div className="lock-logo-wrapper">
              <div className="lock-logo-glow" />
              <img 
                src="/flow_logo.png" 
                alt="Flow Stream Logo" 
                className="lock-brand-img"
              />
              <div className="lock-badge-icon">
                {isSuccess ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <BadgeCheck size={16} color="#6366f1" />
                )}
              </div>
            </div>

            <h1 className="lock-title">FLOW STREAM</h1>
            <p className="lock-subtitle">
              {welcomeDistributor ? (
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  ¡Bienvenido, {welcomeDistributor.nombre}!
                </span>
              ) : (
                'Ingresa tu Código Único de Distribuidor para desbloquear el panel de administración.'
              )}
            </p>
          </div>

          {/* Formulario */}
          <form className="lock-form" onSubmit={handleSubmit}>
            
            {/* Input único de Código de Distribuidor */}
            <div className="lock-input-group">
              <div className="lock-dist-input-wrapper">
                <span className="lock-dist-icon-box">
                  <KeyRound size={18} />
                </span>

                <input
                  id="admin-dist-code-input"
                  type={showCode ? 'text' : 'password'}
                  className={`lock-dist-input ${error ? 'input-error' : ''}`}
                  placeholder="DIST-XXXX"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  disabled={isValidating || isSuccess}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />

                <button
                  type="button"
                  className="lock-eye-btn"
                  onClick={() => setShowCode(!showCode)}
                  title={showCode ? 'Ocultar código' : 'Ver código'}
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Mensaje de error animado */}
            {error && (
              <div className="lock-error-banner">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Fila de switch recordar */}
            <div className="lock-switch-row">
              <label className="lock-switch-label">
                <div 
                  className={`lock-toggle-switch ${rememberMe ? 'active' : ''}`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div className="toggle-thumb" />
                </div>
                <span className="lock-switch-text">Recordar en este equipo</span>
              </label>
            </div>

            {/* Botón principal de desbloqueo */}
            <button
              type="submit"
              className="lock-submit-btn"
              disabled={isValidating || isSuccess}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 size={19} className="success-icon-pulse" />
                  <span>Acceso Concedido...</span>
                </>
              ) : isValidating ? (
                <>
                  <Loader2 size={19} className="spinner-icon" />
                  <span>Verificando Distribuidor...</span>
                </>
              ) : (
                <>
                  <Unlock size={18} />
                  <span>Acceder al Panel</span>
                  <ArrowRight size={18} className="arrow-hover" />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="lock-divider">
            <span className="divider-line" />
            <span className="divider-text">¿ERES CLIENTE DE STREAMING?</span>
            <span className="divider-line" />
          </div>

          {/* Acceso para Clientes Mejorado */}
          <div 
            className="lock-portal-link-card" 
            onClick={onGoToPortal} 
            role="button" 
            tabIndex={0}
            title="Ingresar al portal de autoservicio para clientes"
          >
            <div className="portal-card-top-row">
              <div className="portal-link-icon">
                <Globe size={20} />
              </div>
              <div className="portal-link-header-text">
                <span className="portal-link-title">Portal Auto-Servicio</span>
                <span className="portal-link-badge">
                  <Sparkles size={11} />
                  <span>Sin contraseña</span>
                </span>
              </div>
            </div>

            <p className="portal-link-desc">
              Consulta tus pantallas activas, PINs, fecha de vencimiento y descarga tus comprobantes digitales al instante.
            </p>

            <div className="portal-link-action-row">
              <div className="portal-features-chips">
                <span className="portal-chip">📺 Perfiles</span>
                <span className="portal-chip">⏳ Vencimientos</span>
                <span className="portal-chip">🧾 Recibo Digital</span>
              </div>
              <div className="portal-link-pill">
                <span>Ir al Portal</span>
                <ArrowRight size={13} className="portal-arrow" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
