import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import '../styles/infocard.css';

const InfoCard = ({
  image,
  avatar,
  title,
  subtitle,
  tags = [],
  description,
  link,
  asLink = true,
  extra,
  onClick,
  // Props para el botón de favoritos (solo se usan cuando se necesitan)
  showFavoriteButton = false,
  isFavorite = false,
  onFavoriteClick,
  favoriteLoading = false,
  ...rest
}) => {
  const handleClick = (e) => {
    if (onClick && !asLink) {
      e.preventDefault();
      onClick();
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Evitar que se active el click de la card
    if (onFavoriteClick && !favoriteLoading) {
      onFavoriteClick();
    }
  };

  const CardContent = (
    <>
      <div className='card-image'>
        {image && <img src={image} alt={title} />}
        {/* Botón de favoritos solo cuando se especifique */}
        {showFavoriteButton && (
          <button 
            className={`info-card-favorite-btn ${favoriteLoading ? 'loading' : ''}`}
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? (
              <Star size={20} fill="#FFD700" stroke="#000" strokeWidth={2} />
            ) : (
              <Star size={20} stroke="#000" strokeWidth={2} fill="none" />
            )}
          </button>
        )}
      </div>
      <div className='card-footer'>
        <div className='info-main'>
          {avatar && (
            <img src={avatar} alt={title} className='profile-avatar' />
          )}
          <div className='info-details'>
            <h4 className='info-title'>{title}</h4>
            {subtitle && <p className='info-subtitle'>{subtitle}</p>}
            {tags.length > 0 && (
              <div className='info-tags'>
                <span className='tag-label'>Estilos:</span>
                {tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className='tag-type'>{tag}</span>
                ))}
                {tags.length > 2 && (
                  <span className='tag-more'>+{tags.length - 2}</span>
                )}
              </div>
            )}
            {description && (
              <p className='info-description'>{description}</p>
            )}
            {extra}
          </div>
        </div>
      </div>
    </>
  );

  const cardContent = (
    <div className='info-card' onClick={handleClick}>
      {CardContent}
    </div>
  );

  return asLink && link ? (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }} {...rest}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};

export default InfoCard;