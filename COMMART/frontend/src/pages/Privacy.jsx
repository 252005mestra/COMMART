import React from 'react';
import { ShieldCheck } from 'lucide-react';
import '../styles/legalpages.css';
import Footer from '../components/Footer';
import LandingNav from '../components/LandingNav';
import MainNav from '../components/MainNav';
import { useUser } from '../context/UserContext';

const Privacy = () => {
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
              <span className="icon"><ShieldCheck size={35} /></span>
              Política de Privacidad
            </div>
            <p>
              En COMMART, tu privacidad y la protección de tus datos personales son fundamentales. Esta política describe cómo recopilamos, usamos y protegemos tu información.
            </p>
            <h2>1. Información que Recopilamos</h2>
            <ul>
              <li><b>Datos de registro:</b> Nombre, correo electrónico, nombre de usuario, contraseña y datos de perfil.</li>
              <li><b>Información de pedidos:</b> Detalles de las comisiones, imágenes de referencia, mensajes y archivos enviados.</li>
              <li><b>Datos de pago:</b> Información necesaria para procesar pagos y transferencias, gestionada de forma segura.</li>
              <li><b>Datos de uso:</b> Información sobre tu actividad en la plataforma, como visitas, búsquedas y preferencias.</li>
            </ul>
            <h2>2. Uso de la Información</h2>
            <ul>
              <li>Gestionar cuentas, pedidos y pagos entre usuarios.</li>
              <li>Mejorar la experiencia de usuario y personalizar la plataforma.</li>
              <li>Enviar notificaciones relevantes sobre pedidos, actualizaciones y promociones.</li>
              <li>Prevenir fraudes y garantizar la seguridad de la plataforma.</li>
            </ul>
            <h2>3. Compartir Información</h2>
            <ul>
              <li>No compartimos tu información personal con terceros, salvo para cumplir con obligaciones legales o procesar pagos.</li>
              <li>Podemos compartir datos anónimos y agregados para análisis y mejoras.</li>
            </ul>
            <h2>4. Seguridad</h2>
            <ul>
              <li>Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración.</li>
              <li>El acceso a tus datos está restringido solo al personal autorizado.</li>
            </ul>
            <h2>5. Derechos del Usuario</h2>
            <ul>
              <li>Puedes acceder, modificar o eliminar tus datos desde tu perfil o contactándonos.</li>
              <li>Solicita la eliminación de tu cuenta en cualquier momento.</li>
            </ul>
            <h2>6. Cookies</h2>
            <ul>
              <li>Utilizamos cookies para mejorar la navegación, autenticación y análisis de uso.</li>
              <li>Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador.</li>
            </ul>
            <h2>7. Cambios en la Política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta política. Te notificaremos sobre cambios importantes a través de la plataforma.
            </p>
            <p>
              Si tienes dudas sobre tu privacidad, escríbenos a <a href="mailto:group.commart@gmail.com">group.commart@gmail.com</a>.
            </p>
          </section>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Privacy;