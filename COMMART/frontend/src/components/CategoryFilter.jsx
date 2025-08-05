import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/categoryfilter.css';

const CategoryFilter = ({ onStyleSelect, selectedStyle }) => {
  const [styles, setStyles] = useState([]);
  const [showAll, setShowAll] = useState(false);

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

  const handleStyleClick = (style) => {
    if (selectedStyle && selectedStyle.id === style.id) {
      // Si el estilo ya está seleccionado, deseleccionar
      onStyleSelect(null);
    } else {
      // Seleccionar nuevo estilo
      onStyleSelect(style);
    }
  };

  const handleShowAllClick = () => {
    onStyleSelect(null);
  };

  // Mostrar solo los primeros 6 estilos por defecto
  const visibleStyles = showAll ? styles : styles.slice(0, 6);
  const hasMoreStyles = styles.length > 6;

  return (
    <div className='category-filter'>
      <h3>Categorías</h3>
      <div className='filter-container'>
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
        
        {hasMoreStyles && (
          <button
            className='filter-button show-more'
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '←' : '...'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryFilter;
