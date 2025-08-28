import React from 'react';
import { Link } from 'react-router-dom';
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
  ...rest
}) => {
  const CardContent = (
    <>
      <div className='card-image'>
        {image && <img src={image} alt={title} />}
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

  return asLink && link ? (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }} {...rest}>
      <div className='info-card'>{CardContent}</div>
    </Link>
  ) : (
    <div className='info-card' {...rest}>{CardContent}</div>
  );
};

export default InfoCard;