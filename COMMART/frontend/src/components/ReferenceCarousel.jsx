import React, { useState, useEffect } from 'react';
import { Download, CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import '../styles/referencecarousel.css';

const ReferenceCarousel = ({ open, images = [], onClose }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const prev = (e) => {
    e?.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e?.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  };

  // Descarga usando fetch y blob para forzar descarga automática
  const handleDownload = async (e) => {
    e.stopPropagation();
    const url = images[idx];
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000/${url}`;
    const fileName = `referencia_${idx + 1}.${fullUrl.split('.').pop().split('?')[0] || 'jpg'}`;

    try {
      const response = await fetch(fullUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('No se pudo descargar la imagen.');
    }
  };

  return (
    <div className="image-expanded-overlay" onClick={onClose}>
      <div className="image-expanded-container" onClick={e => e.stopPropagation()}>
        {/* Toolbar: Descargar y Cerrar */}
        <div className="image-expanded-toolbar">
          <button
            className="image-expanded-download-btn"
            onClick={handleDownload}
            title="Descargar imagen"
            type="button"
          >
            <Download size={24} />
          </button>
          <button
            className="image-expanded-close-btn"
            onClick={onClose}
            title="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Flechas de navegación */}
        {images.length > 1 && (
          <>
            <button className="image-expanded-arrow left" onClick={prev} type="button" aria-label="Anterior">
              <CircleArrowLeft size={32} />
            </button>
            <button className="image-expanded-arrow right" onClick={next} type="button" aria-label="Siguiente">
              <CircleArrowRight size={32} />
            </button>
          </>
        )}

        {/* Imagen ampliada */}
        <img
          src={images[idx]?.startsWith('http') ? images[idx] : `http://localhost:5000/${images[idx]}`}
          alt={`Referencia ${idx + 1}`}
          className="image-expanded"
        />

        {/* Contador de imágenes */}
        {images.length > 1 && (
          <div className="image-expanded-counter">
            {idx + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceCarousel;