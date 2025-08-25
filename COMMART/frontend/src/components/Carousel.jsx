import React, { useEffect, useRef, useState } from 'react';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import '../styles/carousel.css';

// Fondos
import lightOrangeBg from '../assets/FondoNaranjaClaro.png';
import darkOrangeBg from '../assets/FondoNaranjaOscuro.png';
import lightGreenBg from '../assets/FondoVerdeClaro.png';
import darkGreenBg from '../assets/FondoVerdeOscuro.png';

// Ratones
import Lino2 from '../assets/1.2 Lino.png';
import Lino3 from '../assets/1.3 Lino.png';
import Tiko2 from '../assets/2.2 Tiko.png';
import Tiko3 from '../assets/2.3 Tiko.png';

const slides = [
  {
    bg: darkOrangeBg,
    character: Tiko2,
    title: '¿Deseas encargar una ilustración con temática +18?',
    desc: 'Activa esta opción y comisiona artistas que ofrecen este contenido.',
    button: 'PROXIMAMENTE...',
    alt: '+18',
    characterPosition: 'left' // Tiko a la izquierda
  },
  {
    bg: darkGreenBg,
    character: Lino3,
    title: '¿Prefieres una navegación libre de anuncios?',
    desc: 'Adquiere nuestra membresía premium y elimina la publicidad de la página para siempre. ¡Disfruta de una sesión sin interrupciones!',
    button: 'PROXIMAMENTE...',
    alt: 'Sin anuncios',
    characterPosition: 'right' // Lino a la derecha
  },
  {
    bg: lightOrangeBg,
    character: Tiko3,
    title: '¿Tienes sugerencias o ideas para mejorar?',
    desc: '¡Nos encantaría saber tu opinión! Deja tus comentarios en nuestro buzón de sugerencias y ayúdanos a brindarte una mejor experiencia.',
    button: 'IR AL BUZÓN',
    alt: 'Sugerencias',
    characterPosition: 'left' // Tiko a la izquierda
  },
  {
    bg: lightGreenBg,
    character: Lino2,
    title: '¿Eres artista y estás listo para recibir comisiones?',
    desc: 'Activa tu cuenta como artista y empieza a mostrar tu talento al mundo. ¡Es el momento de comenzar a ganar por tus ilustraciones!',
    button: 'ACTÍVALO AQUÍ',
    alt: 'Comisiones',
    characterPosition: 'right' // Lino a la derecha
  }
];

const Carousel = () => {
  const [current, setCurrent] = useState(0);
  const autoPlayRef = useRef();
  const touchStartX = useRef(null);

  // Carrusel automático
  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    const play = () => {
      autoPlayRef.current();
    };
    const interval = setInterval(play, 10000);
    return () => clearInterval(interval);
  }, []);

  // Touch/swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const goTo = (idx) => setCurrent(idx);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

  // Floating particles
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: Math.random() * 3 + 3,
      });
    }
    setParticles(arr);
  }, []);

  return (
    <section className='carousel-home'>
      <div
        className='carousel-container'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
      >
        {/* Floating particles */}
        <div className='floating-particles'>
          {particles.map((p, i) => (
            <div
              key={i}
              className='particle'
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            />
          ))}
        </div>

        {/* Slides */}
        <div
          className='carousel-track'
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${current * 100}%)`
          }}
        >
          {slides.map((slide, idx) => (
            <div
              className='slide'
              key={idx}
              style={{
                backgroundImage: `url(${slide.bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className={`slide-content ${slide.characterPosition === 'right' ? 'reverse' : ''}`}>
                <div className='slide-img-col'>
                  <img src={slide.character} alt={slide.alt} className='slide-character' />
                </div>
                <div className='slide-text-col'>
                  <h2>{slide.title}</h2>
                  <p>{slide.desc}</p>
                  <button 
                    className={`slide-btn ${slide.character.includes('Tiko') ? 'tiko-btn' : 'lino-btn'}`}
                  >
                    {slide.button}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flechas */}
        <button className='arrow arrow-left' onClick={prevSlide} aria-label='Anterior'>
          <CircleArrowLeft size={32} />
        </button>
        <button className='arrow arrow-right' onClick={nextSlide} aria-label='Siguiente'>
          <CircleArrowRight size={32} />
        </button>

        {/* Dots */}
        <div className='navigation'>
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`nav-dot${current === idx ? ' active' : ''}`}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;
