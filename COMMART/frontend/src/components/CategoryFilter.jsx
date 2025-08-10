import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/categoryfilter.css';

const CategoryFilter = ({ onStyleSelect, selectedStyle }) => {
  const [styles, setStyles] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(styles.length);
  const [slideOffset, setSlideOffset] = useState(0);
  const [canSlideLeft, setCanSlideLeft] = useState(false);
  const [canSlideRight, setCanSlideRight] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/styles');
        setStyles(response.data);
      } catch (error) {
        console.error('Error al obtener estilos:', error);
      }
    };
    fetchStyles();
  }, []);

  useEffect(() => {
    const calculateVisibleButtons = () => {
      if (!containerRef.current || styles.length === 0) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      
      // Crear un contenedor temporal para medir
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.display = 'flex';
      tempContainer.style.gap = '10px';
      tempContainer.style.width = `${containerWidth}px`;
      document.body.appendChild(tempContainer);

      // Agregar botón "Todos"
      const todosBtn = document.createElement('button');
      todosBtn.textContent = 'Todos';
      todosBtn.className = 'filter-button';
      tempContainer.appendChild(todosBtn);

      let currentWidth = todosBtn.offsetWidth + 10; // Incluye gap
      let count = 0;

      // Medir cada botón de estilo
      for (let i = 0; i < styles.length; i++) {
        const btn = document.createElement('button');
        btn.textContent = styles[i].name;
        btn.className = 'filter-button';
        tempContainer.appendChild(btn);

        const btnWidth = btn.offsetWidth + 10; // Incluye gap
        
        if (currentWidth + btnWidth + 120 <= containerWidth) { // 120px para botones de navegación
          currentWidth += btnWidth;
          count++;
        } else {
          break;
        }
      }

      document.body.removeChild(tempContainer);
      setVisibleCount(count);
      
      // Verificar si se puede deslizar
      setCanSlideLeft(slideOffset > 0);
      setCanSlideRight(slideOffset + count < styles.length);
    };

    if (styles.length > 0) {
      setTimeout(calculateVisibleButtons, 100);
      window.addEventListener('resize', calculateVisibleButtons);
      return () => window.removeEventListener('resize', calculateVisibleButtons);
    }
  }, [styles, slideOffset]);

  const handleStyleClick = (style) => {
    if (selectedStyle && selectedStyle.id === style.id) {
      onStyleSelect(null);
    } else {
      onStyleSelect(style);
    }
  };

  const handleShowAllClick = () => {
    onStyleSelect(null);
  };

  const slideLeft = () => {
    if (canSlideLeft) {
      setSlideOffset(Math.max(0, slideOffset - Math.ceil(visibleCount / 2)));
    }
  };

  const slideRight = () => {
    if (canSlideRight) {
      setSlideOffset(Math.min(styles.length - visibleCount, slideOffset + Math.ceil(visibleCount / 2)));
    }
  };

  const visibleStyles = showAll 
    ? styles 
    : styles.slice(slideOffset, slideOffset + visibleCount);
  const hasHiddenStyles = styles.length > visibleCount;

  return (
    <div className='category-filter'>
      <div className='category-header'>
        <h3>Categorías</h3>
        <div className='category-controls'>
          {hasHiddenStyles && !showAll && (
            <>
              <button
                className={`slide-button ${!canSlideLeft ? 'disabled' : ''}`}
                onClick={slideLeft}
                disabled={!canSlideLeft}
                title="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className={`slide-button ${!canSlideRight ? 'disabled' : ''}`}
                onClick={slideRight}
                disabled={!canSlideRight}
                title="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {hasHiddenStyles && (
            <button
              className='filter-button show-more grid-button'
              onClick={() => {
                setShowAll(!showAll);
                if (!showAll) setSlideOffset(0); // Reset slide when showing all
              }}
              title={showAll ? 'Mostrar menos' : 'Mostrar todas las categorías'}
            >
              <LayoutGrid size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className={`filter-container ${showAll ? 'show-all' : ''}`} ref={containerRef}>
        <button
          className={`filter-button ${!selectedStyle ? 'active' : ''}`}
          onClick={handleShowAllClick}
        >
          Todos
        </button>
        
        {visibleStyles.map((style) => (
          <button
            key={style.id}
            className={`filter-button ${selectedStyle && selectedStyle.id === style.id ? 'active' : ''}`}
            onClick={() => handleStyleClick(style)}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
