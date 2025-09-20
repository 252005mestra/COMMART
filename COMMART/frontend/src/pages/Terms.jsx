import React from 'react';
import { FileText } from 'lucide-react';
import '../styles/legalpages.css';
import Footer from '../components/Footer';
import LandingNav from '../components/LandingNav';
import MainNav from '../components/MainNav';
import { useUser } from '../context/UserContext';

const Terms = () => {
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
              <span className="icon"><FileText size={35} /></span>
              Términos del Servicio
            </div>
            <p>
              Bienvenido a COMMART. Al acceder y utilizar nuestra plataforma, aceptas cumplir con los siguientes términos y condiciones. Te recomendamos leerlos detenidamente antes de utilizar nuestros servicios.
            </p>
            <h2>1. Descripción del Servicio</h2>
            <p>
              COMMART es una plataforma digital que conecta artistas y clientes para la gestión y realización de comisiones artísticas. Los usuarios pueden crear perfiles, publicar portafolios, solicitar y aceptar pedidos, y gestionar pagos de manera segura.
            </p>
            <h2>2. Registro y Cuentas</h2>
            <ul>
              <li>Debes proporcionar información verídica y mantener la confidencialidad de tus credenciales.</li>
              <li>Está prohibido crear cuentas falsas o suplantar la identidad de otras personas.</li>
              <li>COMMART se reserva el derecho de suspender cuentas que incumplan estos términos.</li>
            </ul>
            <h2>3. Uso de la Plataforma</h2>
            <ul>
              <li>Los usuarios deben respetar a otros miembros de la comunidad y mantener una comunicación cordial.</li>
              <li>No se permite la publicación de contenido ofensivo, ilegal o que infrinja derechos de terceros.</li>
              <li>Está prohibido utilizar la plataforma para actividades fraudulentas o ilícitas.</li>
            </ul>
            <h2>4. Pagos y Comisiones</h2>
            <ul>
              <li>Los pagos se gestionan a través de la plataforma y se liberan al completar cada fase del pedido.</li>
              <li>COMMART cobra una comisión por cada transacción realizada.</li>
              <li>Los precios y condiciones de pago son establecidos por los artistas y aceptados por los clientes antes de iniciar el pedido.</li>
            </ul>
            <h2>5. Propiedad Intelectual</h2>
            <ul>
              <li>Los derechos de las obras comisionadas se acuerdan entre artista y cliente.</li>
              <li>COMMART no reclama derechos sobre los trabajos realizados, pero puede mostrar muestras en la plataforma para fines promocionales, siempre respetando la autoría.</li>
            </ul>
            <h2>6. Cancelaciones y Reembolsos</h2>
            <ul>
              <li>Las cancelaciones deben incluir un motivo claro y se gestionan según el avance del pedido.</li>
              <li>Los reembolsos se analizarán caso por caso y pueden estar sujetos a retenciones por trabajo ya realizado.</li>
            </ul>
            <h2>7. Responsabilidad</h2>
            <ul>
              <li>COMMART no se responsabiliza por acuerdos realizados fuera de la plataforma ni por disputas entre usuarios.</li>
              <li>La plataforma actúa como intermediario para facilitar la comunicación y los pagos, pero no garantiza la calidad final de las obras.</li>
            </ul>
            <h2>8. Modificaciones</h2>
            <p>
              COMMART puede actualizar estos términos en cualquier momento. Te notificaremos sobre cambios importantes a través de la plataforma o por correo electrónico.
            </p>
            <p>
              Si tienes dudas, puedes contactarnos a través de la sección de <a href="/help">Ayuda</a> o al correo <a href="mailto:group.commart@gmail.com">group.commart@gmail.com</a>.
            </p>
          </section>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Terms;