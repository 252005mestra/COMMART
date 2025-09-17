import React, { useState, useEffect } from 'react';
import '../styles/referencecarousel.css'; 

const ReferenceCarousel = ({ open, images, onClose }) => {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="image-expanded-overlay" onClick={onClose}>
      <div className="image-expanded-container" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="image-expanded-close" onClick={onClose}>
          ×
        </button>
        
        {/* Flechas de navegación */}
        {images.length > 1 && (
          <>
            <button className="image-expanded-arrow left" onClick={prev}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="image-expanded-arrow right" onClick={next}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        
        {/* Imagen */}
        <img 
          src={images[idx]} 
          alt={`Referencia ${idx + 1}`} 
          className="image-expanded" 
        />
        
        {/* Contador */}
        {images.length > 1 && (
          <div className="image-expanded-counter">
            {idx + 1} de {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceCarousel;