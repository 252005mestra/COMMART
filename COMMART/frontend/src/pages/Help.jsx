import React from 'react';
import { HelpCircle } from 'lucide-react';
import '../styles/legalpages.css';
import Footer from '../components/Footer';
import LandingNav from '../components/LandingNav';
import MainNav from '../components/MainNav';
import { useUser } from '../context/UserContext';

const Help = () => {
  const { profile } = useUser();

  return (
    <>
      {profile ? <MainNav /> : <LandingNav />}
      <div className="legal-cards-bg">
        <div className="legal-logo-wrapper">
          <img
            src="/LogoCOMMART.png"
            alt="Logo COMMART"
            className="legal-logo"
            draggable={false}
          />
        </div>
        <div className="legal-card-container">
          <section className="legal-card">
            <div className="legal-card-title">
              <span className="icon"><HelpCircle size={35} /></span>
              Ayuda y Soporte
            </div>
            <section>
              <h2>¿Qué es COMMART?</h2>
              <p>
                COMMART es una plataforma que conecta artistas y clientes para la creación de obras artísticas personalizadas. Aquí puedes explorar portafolios, encargar ilustraciones y gestionar todo el proceso de forma segura y transparente.
              </p>
            </section>
            <section>
              <h2>Preguntas Frecuentes</h2>
              <ul>
                <li>
                  <b>¿Cómo encargo una obra?</b><br />
                  Ingresa al perfil de un artista, haz clic en "Encargar obra" y completa el formulario con la descripción y referencias. El artista revisará tu solicitud y la aceptará o rechazará.
                </li>
                <li>
                  <b>¿Cómo se realiza el pago?</b><br />
                  El pago se realiza desde el seguimiento del pedido, una vez que el artista sube el boceto y eliges tu favorito. Los pagos son gestionados de forma segura por COMMART.
                </li>
                <li>
                  <b>¿Puedo cancelar un pedido?</b><br />
                  Sí, puedes cancelar tu pedido antes de realizar el pago. El artista también puede cancelar antes de que el pedido esté en proceso avanzado.
                </li>
                <li>
                  <b>¿Dónde veo mis pedidos?</b><br />
                  Accede a "Mis pedidos" desde tu perfil para ver el estado y detalles de tus encargos.
                </li>
                <li>
                  <b>¿Cómo contacto al soporte?</b><br />
                  Puedes escribirnos a <a href="mailto:group.commart@gmail.com">group.commart@gmail.com</a> o dejar tus sugerencias en el buzón de la plataforma.
                </li>
                <li>
                  <b>¿Qué pasa si tengo un problema con un artista o cliente?</b><br />
                  Si surge un conflicto, puedes reportarlo desde el pedido o escribirnos. Nuestro equipo de soporte analizará la situación y te ayudará a resolverla.
                </li>
              </ul>
            </section>
            <section>
              <h2>¿Aún tienes dudas?</h2>
              <p>
                Si necesitas ayuda personalizada, contáctanos por correo o utiliza el buzón de sugerencias. Estamos para apoyarte en cada paso de tu experiencia en COMMART.
              </p>
            </section>
          </section>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Help;