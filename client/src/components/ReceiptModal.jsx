import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Receipt, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Image as ImageIcon
} from 'lucide-react';
import { PLATFORMS } from '../constants/platforms';
import { formatearFecha, getTodayDate, construirEnlaceWhatsApp, generarTextoRecibo } from '../utils/storage';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { useToast } from '../context/ToastContext';

export function ReceiptModal({
  isOpen,
  onClose,
  cliente,
  perfil,
  cuenta
}) {
  const toast = useToast();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef(null);

  const platformInfo = cuenta ? PLATFORMS[cuenta.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
  const folio = 'FS-' + (cliente?.id ? String(cliente.id).replace(/\D/g, '').slice(-4) || '1001' : '1001');
  const fechaHoy = formatearFecha(getTodayDate());
  const fechaVenc = formatearFecha(cliente?.fechaVencimiento);
  const fechaIni = formatearFecha(cliente?.fechaInicio || getTodayDate());
  const precio = Number(cliente?.precioCobrado || 0).toFixed(2);
  const pin = cliente?.pin || perfil?.pin || 'Sin PIN';
  const nombreCliente = cliente?.nombre || 'Cliente';
  const perfilNombre = perfil?.nombre || `Perfil ${perfil?.numero || 1}`;
  const textoRecibo = cliente ? generarTextoRecibo(cliente, perfil, cuenta, folio) : '';

  // Generador de imagen en Canvas
  const drawReceiptCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cliente) return null;
    const ctx = canvas.getContext('2d');

    // Dimensiones en alta resolución para nitidez en celulares
    const width = 800;
    const height = 1050;
    canvas.width = width;
    canvas.height = height;

    // Fondo degradado oscuro premium
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0f1d');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#070b14');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Borde exterior con brillo
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Cabecera decorativa
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(16, 16, width - 32, 140);

    // Título de la App y Logo
    ctx.font = 'bold 36px "Outfit", "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🍿 FLOW STREAM', width / 2, 70);

    ctx.font = '600 17px "Segoe UI", sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('COMPROBANTE OFICIAL DE MEMBRESÍA', width / 2, 105);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`FOLIO: #${folio}  •  FECHA: ${fechaHoy}`, width / 2, 135);

    // Badge de estado Activo
    const badgeY = 185;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect((width / 2) - 130, badgeY - 22, 260, 40, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('✓ MEMBRESÍA ACTIVA Y GARANTIZADA', width / 2, badgeY + 4);

    // Caja de Plataforma Destacada
    const platBoxY = 245;
    ctx.fillStyle = platformInfo.badgeBg || '#1e1b4b';
    ctx.strokeStyle = platformInfo.borderColor || '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(45, platBoxY, width - 90, 85, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "Outfit", "Segoe UI", sans-serif';
    ctx.fillStyle = platformInfo.textColor || '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(platformInfo.name.toUpperCase(), 75, platBoxY + 52);

    ctx.textAlign = 'right';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`S/ ${precio}`, width - 75, platBoxY + 52);

    // Línea divisoria decorativa punteada tipo ticket
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.moveTo(45, 360);
    ctx.lineTo(width - 45, 360);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Datos Clave en 2 Columnas
    ctx.textAlign = 'left';
    let currentY = 410;
    const lineHeight = 55;

    const items = [
      { label: 'CLIENTE', val: nombreCliente },
      { label: 'WHATSAPP', val: `${cliente.codigoPais || '+51'} ${cliente.celular}` },
      { label: 'PERFIL ASIGNADO', val: perfilNombre },
      { label: 'PIN DE SEGURIDAD', val: pin },
      { label: 'INICIO DE SERVICIO', val: fechaIni },
      { label: 'VÁLIDO HASTA', val: fechaVenc, highlight: true }
    ];

    items.forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
      ctx.fillRect(45, currentY - 32, width - 90, 48);

      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(item.label, 65, currentY);

      ctx.textAlign = 'right';
      ctx.font = item.highlight ? 'bold 20px "Segoe UI", sans-serif' : '600 18px "Segoe UI", sans-serif';
      ctx.fillStyle = item.highlight ? '#fbbf24' : '#f8fafc';
      ctx.fillText(item.val, width - 65, currentY);

      ctx.textAlign = 'left';
      currentY += lineHeight;
    });

    // Caja de Reglas y Garantía
    const rulesY = 770;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(45, rulesY, width - 90, 160, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('🛡️ TÉRMINOS Y CONDICIONES DEL SERVICIO:', 65, rulesY + 32);

    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Acceso exclusivo para 1 pantalla en simultáneo.', 65, rulesY + 62);
    ctx.fillText('• Prohibido cambiar contraseñas, correos o alterar perfiles ajenos.', 65, rulesY + 88);
    ctx.fillText('• Garantía y soporte técnico continuo durante los 30 días de vigencia.', 65, rulesY + 114);
    ctx.fillText('• Para renovaciones, contactar con 2 días de anticipación al vencimiento.', 65, rulesY + 140);

    // Pie de Comprobante
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('¡Gracias por tu preferencia! Disfruta tus series y películas favoritas ⭐🍿', width / 2, 975);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Sistema Flow Stream • Comprobante Digital Verificado', width / 2, 1005);

    return canvas;
  }, [cliente, folio, fechaHoy, fechaIni, fechaVenc, nombreCliente, perfilNombre, pin, platformInfo, precio]);

  useEffect(() => {
    if (isOpen && cliente) {
      const timer = setTimeout(() => {
        drawReceiptCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, cliente, drawReceiptCanvas]);

  if (!isOpen || !cliente) return null;

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoRecibo);
    setCopiedText(true);
    toast.success('Comprobante en texto copiado para pegar en WhatsApp');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleEnviarWhatsApp = () => {
    const enlace = construirEnlaceWhatsApp(cliente.codigoPais, cliente.celular, textoRecibo);
    window.open(enlace, '_blank', 'noopener,noreferrer');
    toast.success('Abriendo chat de WhatsApp con el comprobante');
  };

  const handleDescargarImagen = () => {
    const canvas = drawReceiptCanvas();
    if (!canvas) return;

    try {
      const enlace = document.createElement('a');
      const nombreLimpio = (nombreCliente || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const platLimpia = (platformInfo.name || 'Streaming').replace(/[^a-zA-Z0-9]/g, '_');
      enlace.download = `Recibo_${nombreLimpio}_${platLimpia}.png`;
      enlace.href = canvas.toDataURL('image/png');
      enlace.click();
      toast.success('¡Comprobante PNG descargado con éxito!');
    } catch {
      toast.error('No se pudo generar la imagen para descarga.');
    }
  };

  const handleCopiarImagen = async () => {
    const canvas = drawReceiptCanvas();
    if (!canvas) return;

    setIsGeneratingImage(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('No se pudo crear el archivo de imagen');
          setIsGeneratingImage(false);
          return;
        }

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            toast.success('¡Imagen del comprobante copiada al portapapeles! Puedes pegarla (Ctrl+V) en WhatsApp.');
            setTimeout(() => setCopiedImage(false), 2500);
          } catch {
            // Fallback: descargar si el navegador bloquea copiar imagen
            handleDescargarImagen();
          }
        } else {
          handleDescargarImagen();
        }
        setIsGeneratingImage(false);
      }, 'image/png');
    } catch {
      setIsGeneratingImage(false);
      handleDescargarImagen();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Cabecera del Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <Receipt size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-title">Comprobante Digital de Membresía</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Recibo formal para entregar o enviar por WhatsApp al cliente
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Vista previa gráfica del Recibo / Ticket */}
          <div className="receipt-card-preview">
            {/* Top Bar */}
            <div className="receipt-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🍿</span>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>
                    FLOW STREAM
                  </span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    background: 'rgba(99, 102, 241, 0.3)', 
                    color: '#a5b4fc', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    marginLeft: '6px',
                    fontWeight: 700
                  }}>
                    PRO
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  FOLIO #{folio}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {fechaHoy}
                </div>
              </div>
            </div>

            {/* Servicio y Monto */}
            <div className="receipt-service-row">
              <div>
                <span 
                  className="platform-pill"
                  style={{
                    backgroundColor: platformInfo.badgeBg,
                    color: platformInfo.textColor,
                    borderColor: platformInfo.borderColor,
                    fontSize: '0.85rem',
                    padding: '4px 12px'
                  }}
                >
                  {platformInfo.name}
                </span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginLeft: '10px' }}>
                  {perfilNombre}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                  S/ {precio}
                </div>
                <span style={{ 
                  fontSize: '0.68rem', 
                  color: '#34d399', 
                  fontWeight: 700, 
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ✓ PAGADO
                </span>
              </div>
            </div>

            {/* Separador de ticket punteado con muescas laterales */}
            <div className="ticket-divider">
              <div className="ticket-notch left" />
              <div className="ticket-line" />
              <div className="ticket-notch right" />
            </div>

            {/* Grilla de datos */}
            <div className="receipt-details-grid">
              <div className="receipt-detail-item">
                <span className="receipt-detail-label">Cliente</span>
                <span className="receipt-detail-value">{nombreCliente}</span>
              </div>
              <div className="receipt-detail-item">
                <span className="receipt-detail-label">WhatsApp</span>
                <span className="receipt-detail-value">{cliente.codigoPais || '+51'} {cliente.celular}</span>
              </div>
              <div className="receipt-detail-item">
                <span className="receipt-detail-label">PIN Asignado</span>
                <span className="receipt-detail-value font-mono" style={{ color: '#fbbf24' }}>{pin}</span>
              </div>
              <div className="receipt-detail-item">
                <span className="receipt-detail-label">Vigencia (30 Días)</span>
                <span className="receipt-detail-value highlight-expiry">
                  Hasta el {fechaVenc}
                </span>
              </div>
            </div>

            {/* Garantía */}
            <div className="receipt-guarantee-box">
              <ShieldCheck size={16} color="#10b981" />
              <span>Garantía y soporte activo durante todo el mes de servicio.</span>
            </div>
          </div>

          {/* Canvas oculto para exportar a PNG de alta resolución */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Botones de acción principales */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Botón WhatsApp Directo */}
            <button
              type="button"
              className="btn btn-whatsapp"
              onClick={handleEnviarWhatsApp}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
            >
              <WhatsAppIcon size={20} color="#063c19" />
              <span>Enviar Comprobante por WhatsApp</span>
            </button>

            {/* Acciones secundarias en cuadrícula */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopiarTexto}
                style={{ justifyContent: 'center', fontSize: '0.85rem' }}
              >
                {copiedText ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                <span>{copiedText ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopiarImagen}
                disabled={isGeneratingImage}
                style={{ justifyContent: 'center', fontSize: '0.85rem' }}
              >
                {copiedImage ? <Check size={16} color="#34d399" /> : <ImageIcon size={16} />}
                <span>{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDescargarImagen}
                style={{ justifyContent: 'center', fontSize: '0.85rem' }}
              >
                <Download size={16} />
                <span>Descargar PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
