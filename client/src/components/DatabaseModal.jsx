import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileCode, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { generarScriptSQL } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from './ConfirmModal';

export function DatabaseModal({ 
  isOpen, 
  onClose, 
  cuentas = [], 
  clientes = [], 
  onImportData,
  onClearAllData
}) {
  const toast = useToast();
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [copiadoJson, setCopiadoJson] = useState(false);
  const [pestaña, setPestaña] = useState('sql'); // 'sql' | 'archivos' | 'backup'

  if (!isOpen) return null;

  const scriptSqlActual = generarScriptSQL({ cuentas, clientes });

  const handleCopiarSQL = () => {
    navigator.clipboard.writeText(scriptSqlActual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDescargarSQL = () => {
    const blob = new Blob([scriptSqlActual], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowstream_export_${new Date().toISOString().split('T')[0]}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDescargarJSON = () => {
    const backup = JSON.stringify({ cuentas, clientes, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowstream_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubirJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.cuentas && parsed.clientes) {
          onImportData(parsed);
          toast.success('¡Base de datos restaurada con éxito!');
          onClose();
        } else {
          toast.error('El archivo no tiene el formato correcto de respaldo JSON.');
        }
      } catch (err) {
        toast.error('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmarLimpieza = () => {
    if (onClearAllData) onClearAllData();
    toast.success('¡Sistema vaciado con éxito! Ahora puedes registrar tus cuentas y clientes reales.');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h2 className="modal-title">Gestión de Base de Datos SQL</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Scripts DDL/DML para ejecutar en tu servidor de Base de Datos
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Pestañas internas */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <button 
              type="button" 
              className={`pill-btn ${pestaña === 'sql' ? 'active' : ''}`}
              onClick={() => setPestaña('sql')}
            >
              <FileCode size={14} />
              <span>Query SQL en Vivo</span>
            </button>
            <button 
              type="button" 
              className={`pill-btn ${pestaña === 'archivos' ? 'active' : ''}`}
              onClick={() => setPestaña('archivos')}
            >
              <Database size={14} />
              <span>Archivos en /database</span>
            </button>
            <button 
              type="button" 
              className={`pill-btn ${pestaña === 'backup' ? 'active' : ''}`}
              onClick={() => setPestaña('backup')}
            >
              <Download size={14} />
              <span>Copia de Seguridad (JSON)</span>
            </button>
          </div>

          {/* Pestaña 1: SQL Generado en vivo */}
          {pestaña === 'sql' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span>
                  Cumpliendo tu regla, no se ejecutan cambios directos en BD. Aquí tienes las sentencias <code>INSERT</code> de tus {cuentas.length} cuentas y {clientes.length} clientes para que las ejecutes tú mismo.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={handleCopiarSQL} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  {copiado ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  <span>{copiado ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
                <button className="btn btn-primary" onClick={handleDescargarSQL} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Download size={14} />
                  <span>Descargar Archivo .sql</span>
                </button>
              </div>

              <pre className="sql-code-box">
                {scriptSqlActual}
              </pre>
            </div>
          )}

          {/* Pestaña 2: Archivos SQL del proyecto */}
          {pestaña === 'archivos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Los siguientes archivos SQL han sido creados en la carpeta de tu proyecto listos para ser abiertos con tu gestor (MySQL Workbench, phpMyAdmin, DBeaver o consola):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#10b981' }}>📄 database/schema_supabase_postgres.sql</strong>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Recomendado (Supabase/PostgreSQL)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Estructura 100% limpia sin datos (0 registros). Crea las tablas y disparadores en Supabase o PostgreSQL para empezar a ingresar tus datos reales.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>📄 database/schema.sql</strong>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MySQL / MariaDB</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Estructura limpia para MySQL / phpMyAdmin. Crea las tablas relacionales sin datos de prueba.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#f87171' }}>📄 database/limpiar_base_datos.sql</strong>
                    <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Limpieza TRUNCATE</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Query para vaciar por completo todas las tablas de tu base de datos y reiniciar los IDs a 1 en caso de que desees reiniciar de cero.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#a855f7' }}>📄 database/queries_utiles.sql</strong>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Consultas Rápidas</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Consultas clave preparadas: clientes que vencen en 2 días, perfiles libres para venta, balance financiero y queries para renovar por 30 días.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña 3: Backup y Restauración JSON */}
          {pestaña === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Descargar Copia de Seguridad</h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Guarda un archivo de respaldo con todas tus cuentas, perfiles y clientes actuales.
                  </p>
                </div>
                <div>
                  <button className="btn btn-secondary" onClick={handleDescargarJSON}>
                    <Download size={16} />
                    <span>Descargar streamflow_backup.json</span>
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Restaurar desde Respaldo</h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Carga un archivo de respaldo previo para restaurar todas tus cuentas y clientes en segundos.
                  </p>
                </div>
                <div>
                  <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <Upload size={16} />
                    <span>Subir Archivo de Respaldo (.json)</span>
                    <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleSubirJSON} 
                    style={{ display: 'none' }} 
                  />
                </label>
                </div>
              </div>

              {/* Opción de Iniciar Sistema en Blanco */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={20} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ color: '#fca5a5', fontSize: '0.95rem' }}>Iniciar Sistema en Blanco (0 Registros)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
                      Vacía todas las cuentas y clientes de demostración para que comiences a registrar tus cuentas completas y clientes reales desde cero.
                    </p>
                  </div>
                </div>
                <div>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsConfirmClearOpen(true)}
                    style={{ 
                      borderColor: 'rgba(239, 68, 68, 0.5)', 
                      color: '#fca5a5',
                      background: 'rgba(239, 68, 68, 0.15)' 
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Vaciar Todo y Comenzar en Blanco</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de confirmación para vaciar la base de datos */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleConfirmarLimpieza}
        title="¿Vaciar todo el sistema?"
        message="Esta acción eliminará todas las cuentas y clientes actuales para comenzar de cero con tus datos reales. Esta acción no se puede deshacer a menos que tengas un respaldo JSON."
        confirmText="Sí, vaciar todo"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
