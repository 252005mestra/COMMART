import React from 'react';
import { X, Download, Calendar, User, CreditCard, Package } from 'lucide-react';
import '../styles/invoicemodal.css';

const InvoiceModal = ({ open, invoiceData, onClose }) => {
  if (!open || !invoiceData) return null;

  const handleDownload = () => {
    // Función para generar y descargar la factura como imagen
    const invoiceContent = document.querySelector('.invoice-modal-content');
    
    // Aquí puedes implementar html2canvas para generar la imagen
    console.log('Descargando factura...');
    
    // Por ahora, solo mostramos un mensaje
    alert('Funcionalidad de descarga en desarrollo');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header con botones de acción */}
        <div className="invoice-modal-header">
          <button 
            className="invoice-download-btn"
            onClick={handleDownload}
            title="Descargar factura"
          >
            <Download size={18} />
            Descargar
          </button>
          <button 
            className="invoice-close-btn"
            onClick={onClose}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido de la factura */}
        <div className="invoice-modal-content">
          {/* Header de la factura */}
          <div className="invoice-header">
            <div className="invoice-logo-section">
              <img 
                src="/src/assets/LogoCOMMART.png" 
                alt="COMMART" 
                className="invoice-logo"
              />
              <div className="invoice-company-info">
                <h1 className="invoice-company-name">COMMART</h1>
                <p className="invoice-company-subtitle">Plataforma de Arte Digital</p>
              </div>
            </div>
            <div className="invoice-document-info">
              <h2 className="invoice-title">FACTURA DE PAGO</h2>
              <div className="invoice-number">
                <span className="invoice-label">Factura #</span>
                <span className="invoice-value">CMT-{invoiceData.orderId.toString().padStart(6, '0')}</span>
              </div>
            </div>
          </div>

          {/* Información del pedido */}
          <div className="invoice-order-section">
            <div className="invoice-section-title">
              <Package size={20} />
              Información del Pedido
            </div>
            <div className="invoice-details-grid">
              <div className="invoice-detail-item">
                <span className="invoice-detail-label">ID del Pedido:</span>
                <span className="invoice-detail-value">#{invoiceData.orderId}</span>
              </div>
              <div className="invoice-detail-item">
                <span className="invoice-detail-label">Estado del Pedido:</span>
                <span className="invoice-detail-value invoice-status-paid">
                  ✅ Pagado
                </span>
              </div>
              <div className="invoice-detail-item">
                <span className="invoice-detail-label">Fase Actual:</span>
                <span className="invoice-detail-value invoice-stage">
                  {invoiceData.stage === 'plan' && '📋 Planeación'}
                  {invoiceData.stage === 'sketch' && '✏️ Boceto'}
                  {invoiceData.stage === 'details' && '🎨 Detalles'}
                  {invoiceData.stage === 'final' && '✨ Últimos Detalles'}
                  {invoiceData.stage === 'completed' && '🎉 Finalizado'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de las partes */}
          <div className="invoice-parties-section">
            <div className="invoice-party-card client-card">
              <div className="invoice-party-header">
                <User size={18} />
                <span>Cliente</span>
              </div>
              <div className="invoice-party-name">{invoiceData.client}</div>
              <div className="invoice-party-role">Solicitante del pedido</div>
            </div>

            <div className="invoice-party-card artist-card">
              <div className="invoice-party-header">
                <User size={18} />
                <span>Artista</span>
              </div>
              <div className="invoice-party-name">{invoiceData.artist}</div>
              <div className="invoice-party-role">Ejecutor del trabajo</div>
            </div>
          </div>

          {/* Información del pago */}
          <div className="invoice-payment-section">
            <div className="invoice-section-title">
              <CreditCard size={20} />
              Información de Pago
            </div>
            <div className="invoice-payment-details">
              <div className="invoice-payment-item">
                <Calendar size={16} />
                <span className="invoice-payment-label">Fecha de Pago:</span>
                <span className="invoice-payment-value">{formatDate(invoiceData.date)}</span>
              </div>
              <div className="invoice-payment-item">
                <CreditCard size={16} />
                <span className="invoice-payment-label">Método de Pago:</span>
                <span className="invoice-payment-value">Wompi (Pasarela de Pagos)</span>
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="invoice-summary-section">
            <div className="invoice-summary-row subtotal">
              <span className="invoice-summary-label">Subtotal:</span>
              <span className="invoice-summary-value">{formatCurrency(invoiceData.amount)}</span>
            </div>
            <div className="invoice-summary-row commission">
              <span className="invoice-summary-label">Comisión COMMART (25%):</span>
              <span className="invoice-summary-value">{formatCurrency(invoiceData.amount * 0.25)}</span>
            </div>
            <div className="invoice-summary-row artist-payment">
              <span className="invoice-summary-label">Pago al Artista:</span>
              <span className="invoice-summary-value">{formatCurrency(invoiceData.amount * 0.75)}</span>
            </div>
            <div className="invoice-summary-divider"></div>
            <div className="invoice-summary-row total">
              <span className="invoice-summary-label">Total Pagado:</span>
              <span className="invoice-summary-value">{formatCurrency(invoiceData.amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="invoice-footer-text">
              <p>¡Gracias por confiar en COMMART para tu proyecto de arte digital!</p>
              <p>Esta factura confirma el pago exitoso de tu pedido.</p>
            </div>
            <div className="invoice-footer-timestamp">
              Factura generada el {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;