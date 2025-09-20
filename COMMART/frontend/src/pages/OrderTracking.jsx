import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import AlertModal from '../components/AlertModal';
import OrderDataCard from '../components/OrderDataCard';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/ordertracking.css';

const STAGES = [
  { key: 'plan', label: 'Planeación' },
  { key: 'sketch', label: 'Boceto' },
  { key: 'details', label: 'Detalles' },
  { key: 'final', label: 'Últimos Detalles' },
  { key: 'completed', label: 'Finalizado' }
];

const OrderTracking = ({ user }) => {
  const location = useLocation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [sampleFiles, setSampleFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [artistUser, setArtistUser] = useState(null);
  const [selectedStage, setSelectedStage] = useState('plan');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const messageListRef = useRef(null);

  useEffect(() => {
    const fetchOrderAndUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { withCredentials: true });
        setOrder(res.data);

        // Obtener datos de cliente y artista
        const [clientRes, artistRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/users/${res.data.client_id}`, { withCredentials: true }),
          axios.get(`http://localhost:5000/api/auth/users/${res.data.artist_id}`, { withCredentials: true }),
        ]);

        setClientUser(clientRes.data);
        setArtistUser(artistRes.data);

        // AGREGAR: Obtener datos del paquete
        if (res.data.package_id) {
          try {
            const packageRes = await axios.get(`http://localhost:5000/api/packages/artist/${res.data.artist_id}`, { withCredentials: true });
            const selectedPkg = packageRes.data.find(pkg => pkg.id === res.data.package_id);
            setSelectedPackage(selectedPkg);
          } catch (err) {
            console.error('Error al obtener paquete:', err);
          }
        }

        // AGREGAR: Obtener datos de extras
        if (res.data.extras) {
          try {
            const extrasRes = await axios.get(`http://localhost:5000/api/packages/all/extras`, { withCredentials: true });
            let extrasIds = [];
            
            if (typeof res.data.extras === 'string') {
              extrasIds = res.data.extras.split(',').map(id => id.trim());
            } else if (Array.isArray(res.data.extras)) {
              extrasIds = res.data.extras;
            }
            
            const selectedExtras = extrasRes.data.filter(extra => 
              extrasIds.includes(String(extra.id))
            );
            setSelectedExtras(selectedExtras);
          } catch (err) {
            console.error('Error al obtener extras:', err);
          }
        }

      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndUsers();
  }, [id]);

  useEffect(() => {
    if (order && selectedStage) {
      fetchMessages(selectedStage);
    }
    // eslint-disable-next-line
  }, [order, selectedStage]);

  useEffect(() => {
    if (!sampleFiles.length) {
      setPreviewUrls([]);
      return;
    }
    const urls = sampleFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [sampleFiles]);

  const fetchMessages = async (stage) => {
    const res = await axios.get(`http://localhost:5000/api/orders/${id}/messages/${stage}`, { withCredentials: true });
    setMessages(res.data);
  };

  const handleSendMsg = async () => {
    if (!msg.trim()) return;
    const newMsg = {
      sender_id: user.id,
      message: msg,
      sender_username: user.username,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    setMsg('');
    try {
      await axios.post(
        `http://localhost:5000/api/orders/${order.id}/message`,
        { phase: selectedStage, message: msg },
        { withCredentials: true }
      );
    } catch (e) {
      setAlert({ open: true, type: 'error', message: 'Error al enviar el mensaje.' });
    }
  };

  const handleAdvancePhase = async () => {
    const currentIdx = STAGES.findIndex(s => s.key === order.current_stage);
    if (currentIdx === -1 || currentIdx >= STAGES.length - 1) return;

    const nextStage = STAGES[currentIdx + 1].key;
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/phase`,
        { next_phase: nextStage },
        { withCredentials: true }
      );
      // Recarga el pedido para actualizar la fase
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      setSelectedStage(res.data.current_stage);
      setSampleFiles([]);
      setPreviewUrls([]);
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al avanzar de fase.' });
    }
  };

  const handleUploadSamples = async () => {
    if (!sampleFiles.length) return;
    try {
      for (const file of sampleFiles) {
        const formData = new FormData();
        formData.append('phase', selectedStage);
        formData.append('sample_image', file);
        await axios.post(
          `http://localhost:5000/api/orders/${order.id}/sample`,
          formData,
          { withCredentials: true }
        );
      }
      setSampleFiles([]);
      setPreviewUrls([]);
      // Recarga el pedido para ver las muestras subidas y habilitar el avance de fase
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al subir muestras.' });
    }
  };

  const handleToggleInvoice = () => {
    setShowInvoice(prev => !prev);
    if (!showInvoice && order && clientUser && artistUser) {
      setInvoiceData({
        orderId: order.id,
        client: clientUser.username,
        artist: artistUser.username,
        amount: order.price || order.amount || 100,
        date: order.paid_at
          ? new Date(order.paid_at).toLocaleString()
          : new Date().toLocaleString(),
        stage: order.current_stage
      });
    }
  };

  const handlePay = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/orders/${order.id}/pay`,
        {},
        { withCredentials: true }
      );
      // Recarga el pedido y usuarios para tener los datos actualizados
      const [orderRes, clientRes, artistRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/auth/users/${order.client_id}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/auth/users/${order.artist_id}`, { withCredentials: true }),
      ]);
      setOrder(orderRes.data);
      setClientUser(clientRes.data);
      setArtistUser(artistRes.data);

      setInvoiceData({
        orderId: orderRes.data.id,
        client: clientRes.data.username,
        artist: artistRes.data.username,
        amount: orderRes.data.price || orderRes.data.amount || 100,
        date: orderRes.data.paid_at
          ? new Date(orderRes.data.paid_at).toLocaleString()
          : new Date().toLocaleString(),
        stage: orderRes.data.current_stage
      });
      setShowInvoice(true);
    } catch (err) {
      setAlert({ open: true, type: 'error', message: err.response?.data?.message || 'Error al registrar el pago' });
    }
  };

  // Nueva función para recargar el pedido
  const reloadOrder = async () => {
    const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { withCredentials: true });
    setOrder(res.data);
  };

  // Función para aceptar pedido
  const handleAccept = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'in_progress' },
        { withCredentials: true }
      );
      await reloadOrder();
      setAlert({ open: true, type: 'success', message: 'Pedido aceptado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al aceptar el pedido.' });
    }
  };

  // Función para rechazar pedido
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo para el rechazo.' });
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'rejected', reason: rejectReason },
        { withCredentials: true }
      );
      setShowRejectModal(false);
      setRejectReason('');
      await reloadOrder();
      setAlert({ open: true, type: 'success', message: 'Pedido rechazado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al rechazar el pedido.' });
    }
  };

  // Función para cancelar pedido
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo para la cancelación.' });
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'cancelled', reason: cancelReason },
        { withCredentials: true }
      );
      setShowCancelModal(false);
      setCancelReason('');
      await reloadOrder();
      setAlert({ open: true, type: 'success', message: 'Pedido cancelado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al cancelar el pedido.' });
    }
  };

  // Función para marcar como completado (solo cliente, fase final)
  const handleMarkAsCompleted = async () => {
    if (order.current_stage !== 'final' || order.status === 'completed') return;
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'completed' },
        { withCredentials: true }
      );
      // Recargar pedido
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      setAlert({ open: true, type: 'success', message: 'Pedido marcado como completado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al marcar como completado.' });
    }
  };

  // Solo permitir mensajes y muestras en la fase actual y si no está finalizado
  const isFinal = ['cancelled', 'rejected', 'completed', 'finalized'].includes(order?.status);
  const canSendMsg = !isFinal && selectedStage === order?.current_stage;
  const canUploadSamples = user?.role === 'artist' && !isFinal && selectedStage === order?.current_stage;

  // Fases por las que ha pasado el pedido (hasta la actual)
  const currentStageIdx = order ? STAGES.findIndex(s => s.key === order.current_stage) : 0;
  const availableStages = order ? STAGES.slice(0, currentStageIdx + 1) : [STAGES[0]];

  // Imágenes de la fase seleccionada
  const selectedPhaseImages = order && order[`${selectedStage}_image`]
    ? order[`${selectedStage}_image`].split(',').filter(Boolean)
    : [];

  useEffect(() => {
    // Selecciona la fase si viene en el estado de navegación
    if (location.state?.phase && location.state.phase !== selectedStage) {
      setSelectedStage(location.state.phase);
    } else if (!location.state?.phase && order?.current_stage && selectedStage !== order.current_stage) {
      // Si no viene fase, selecciona la actual
      setSelectedStage(order.current_stage);
    }
    // Si la notificación trae un messageId, haz scroll al mensaje
    if (location.state?.messageId && messages.length > 0) {
      const idx = messages.findIndex(m => String(m.id) === String(location.state.messageId));
      if (idx !== -1 && messageListRef.current) {
        const msgNode = messageListRef.current.children[idx];
        if (msgNode) {
          msgNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    // eslint-disable-next-line
  }, [location.key, location.search, messages, order?.current_stage]);

  if (!user) return <div>Cargando usuario...</div>;
  if (loading) return <div>Cargando pedido...</div>;
  if (!order) return <div>No encontrado</div>;

  // Mostrar mensaje si el pedido fue rechazado
  if (order.status === 'rejected') {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <h2>Pedido rechazado</h2>
          <div>
            <b>Motivo:</b> {order.rejection_reason || 'Sin motivo especificado'}
          </div>
          <AlertModal
            open={alert.open}
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(a => ({ ...a, open: false }))}
          />
        </main>
        <Footer />
      </>
    );
  }

  // Cliente: solo ve detalles y mensaje si está pendiente
  if (user.id === order.client_id && order.status === 'pending') {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <h2>Tu pedido está pendiente de aceptación por el artista.</h2>
          <div>
            <b>Artista:</b> {artistUser?.username}
          </div>
          <div>
            <b>Descripción:</b> {order.description}
          </div>
          <div>
            <b>Estado:</b> {order.status}
          </div>
          <div>
            <b>Imágenes de referencia:</b>
            <div style={{ display: 'flex', gap: 8 }}>
              {order.references_image && order.references_image.split(',').map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:5000/${img}`}
                  alt={`Referencia ${idx + 1}`}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </div>
          </div>
          <p>Podrás ver el proceso cuando el artista acepte tu pedido.</p>
          <AlertModal
            open={alert.open}
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(a => ({ ...a, open: false }))}
          />
        </main>
        <Footer />
      </>
    );
  }

  // Artista: ve detalles y botones si está pendiente
  if (user.id === order.artist_id && order.status === 'pending') {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <h2>Tienes una nueva solicitud de pedido.</h2>
          <div>
            <b>Cliente:</b> {clientUser?.username}
          </div>
          <div>
            <b>Descripción:</b> {order.description}
          </div>
          <div>
            <b>Estado:</b> {order.status}
          </div>
          <div>
            <b>Imágenes de referencia:</b>
            <div style={{ display: 'flex', gap: 8 }}>
              {order.references_image && order.references_image.split(',').map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:5000/${img}`}
                  alt={`Referencia ${idx + 1}`}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </div>
          </div>
          <p>Debes aceptar o rechazar el pedido para iniciar el proceso.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              style={{ background: '#7d5938', color: 'white' }}
              onClick={handleAccept}
            >
              Aceptar pedido
            </button>
            <button
              style={{ background: '#e74c3c', color: 'white' }}
              onClick={() => setShowRejectModal(true)}
            >
              Rechazar pedido
            </button>
          </div>
          <AlertModal
            open={alert.open}
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(a => ({ ...a, open: false }))}
          />
        </main>
        <Footer />
      </>
    );
  }

  // Layout principal: seguimiento (izquierda) + datos del pedido (derecha)
  return (
    <>
      <MainNav />
      <main className="main-content">
        <div className="ordertracking-main-layout">
          {/* Columna izquierda */}
          <section className="ordertracking-tracking-col">
            <h2 className="ordertracking-title">Estado del Pedido</h2>
            {/* Navegación de fases */}
            <div className="ordertracking-stages-nav">
              {STAGES.map((stage, idx) => (
                <div
                  key={stage.key}
                  className={`ordertracking-stage-item${selectedStage === stage.key ? ' active' : ''}${idx <= currentStageIdx ? ' reached' : ''}`}
                  onClick={() => idx <= currentStageIdx && setSelectedStage(stage.key)}
                >
                  <div className="ordertracking-stage-dot" />
                  <span className="ordertracking-stage-label">{stage.label}</span>
                </div>
              ))}
            </div>
            {/* Contenido de la fase seleccionada */}
            <div className="ordertracking-phase-content">
              <h3 className="ordertracking-phase-title">{STAGES.find(s => s.key === selectedStage)?.label}</h3>
              
              {/* Muestras del artista */}
              <div className="ordertracking-section">
                <div className="ordertracking-section-title">
                  Muestras del artista ({STAGES.find(s => s.key === selectedStage)?.label}):
                </div>
                {selectedPhaseImages.length > 0 ? (
                  <div className="ordertracking-samples-list">
                    {selectedPhaseImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={`http://localhost:5000/${img}`}
                        alt={`Muestra ${idx + 1}`}
                        className="ordertracking-sample-img"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="ordertracking-no-samples">Sin muestras aún</span>
                )}
              </div>
              
              {/* Subir muestras solo si es artista, fase actual y no finalizado */}
              {canUploadSamples && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Subir muestras (máx 3 por fase)</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => setSampleFiles(Array.from(e.target.files).slice(0, 3))}
                  />
                  <div className="ordertracking-preview-list">
                    {previewUrls.map((url, idx) => (
                      <img key={idx} src={url} alt={`Preview ${idx + 1}`} className="ordertracking-preview-img" />
                    ))}
                  </div>
                  <button className="ordertracking-upload-btn" onClick={handleUploadSamples} disabled={!sampleFiles.length}>Subir muestras</button>
                </div>
              )}
              
              {/* Comunicación */}
              <div className="ordertracking-section">
                <div className="ordertracking-section-title">
                  Comunicación ({STAGES.find(s => s.key === selectedStage)?.label})
                </div>
                <div
                  ref={messageListRef}
                  className="ordertracking-messages-list"
                >
                  {messages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={`ordertracking-message${location.state?.messageId && String(m.id) === String(location.state.messageId) ? ' highlighted' : ''}`}
                    >
                      <b>
                        {m.sender_id === user.id
                          ? 'Tú'
                          : m.sender_username || 'Usuario'}
                        :
                      </b> {m.message}
                    </div>
                  ))}
                </div>
                <div className="ordertracking-message-input-row">
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={!canSendMsg}
                    className="ordertracking-message-input"
                  />
                  <button
                    className="ordertracking-send-btn"
                    onClick={handleSendMsg}
                    disabled={!msg.trim() || !canSendMsg}
                  >
                    Enviar
                  </button>
                </div>
                {!canSendMsg && (
                  <div className="ordertracking-message-note">
                    Solo puedes enviar mensajes en la fase actual y si el pedido no está finalizado.
                  </div>
                )}
              </div>
              
              {/* Subir arte final (solo artista, solo en la última fase) */}
              {user.role === 'artist' && order.current_stage === 'final' && !isFinal && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Subir arte final</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const formData = new FormData();
                        formData.append('final_image', file);
                        await axios.post(
                          `http://localhost:5000/api/orders/${order.id}/final`,
                          formData,
                          { withCredentials: true }
                        );
                        // Recarga el pedido para mostrar el archivo final
                        const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
                        setOrder(res.data);
                        setAlert({ open: true, type: 'success', message: 'Arte final subido correctamente.' });
                      } catch (err) {
                        setAlert({ open: true, type: 'error', message: 'Error al subir el arte final.' });
                      }
                    }}
                  />
                  {order.completed_image && (
                    <div style={{ marginTop: 8 }}>
                      <b>Archivo final subido:</b>
                      <img src={`http://localhost:5000/${order.completed_image}`} alt="Arte final" width={180} style={{ display: 'block', margin: '8px 0' }} />
                      <a href={`http://localhost:5000/${order.completed_image}`} download>
                        Descargar arte final
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {/* Descargar arte final (solo cliente, solo si existe el archivo y el pedido está completado) */}
              {user.role === 'client' && order.current_stage === 'completed' && order.status === 'completed' && order.completed_image && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Descargar arte final</div>
                  <a href={`http://localhost:5000/${order.completed_image}`} download>
                    Descargar arte final
                  </a>
                </div>
              )}
              
              {/* Mostrar factura solo si el pedido está pagado */}
              {user.role === 'client' && order.is_paid && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Factura</div>
                  <button className="ordertracking-invoice-btn" onClick={handleToggleInvoice}>
                    {showInvoice ? 'Ocultar' : 'Mostrar'} factura
                  </button>
                  {showInvoice && invoiceData && (
                    <div className="ordertracking-invoice-modal">
                      <div className="ordertracking-invoice-content">
                        <h2>Factura de Pago</h2>
                        <p><b>Pedido:</b> #{invoiceData.orderId}</p>
                        <p><b>Cliente:</b> {invoiceData.client}</p>
                        <p><b>Artista:</b> {invoiceData.artist}</p>
                        <p><b>Monto:</b> ${invoiceData.amount}</p>
                        <p><b>Fecha:</b> {invoiceData.date}</p>
                        <p><b>Fase pagada:</b> {invoiceData.stage}</p>
                        <button onClick={() => setShowInvoice(false)}>Cerrar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Descargar arte final (solo artista, solo si el pedido está completado y hay imagen final) */}
              {user.role === 'artist' && order.status === 'completed' && order.final_image && (
                <a
                  href={`http://localhost:5000/${order.final_image}`}
                  download={`arte_final_pedido_${order.id}.jpg`}
                  className="ordertracking-download-btn"
                >
                  Descargar arte final
                </a>
              )}
              
              {/* Solo mostrar el botón si el usuario es cliente, el pedido está en fase final y no está completado */}
              {user.id === order.client_id && order.current_stage === 'final' && order.status !== 'completed' && (
                <button className="ordertracking-completed-btn" onClick={handleMarkAsCompleted}>
                  Marcar como completado
                </button>
              )}
              
              {/* Botón para avanzar de fase */}
              {user.role === 'artist'
                && !isFinal
                && selectedStage === order.current_stage
                && selectedPhaseImages.length > 0
                && (
                  <button
                    className="ordertracking-advance-btn"
                    onClick={handleAdvancePhase}
                  >
                    Avanzar a la la siguiente fase
                  </button>
                )
              }
            </div>
            
            <AlertModal
              open={alert.open}
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(a => ({ ...a, open: false }))}
            />
          </section>

          {/* Columna derecha */}
          <aside className="ordertracking-data-col">
            <div className="ordertracking-data-green-header">
              <h2>Datos del pedido</h2>
            </div>
            <div className="ordertracking-data-section-bg">
              <div className="ordertracking-data-content">
                <OrderDataCard
                  order={order}
                  clientUser={order.clientUser}
                  artistUser={artistUser}
                  images={order.references_image ? order.references_image.split(',').map(img => `http://localhost:5000/${img}`) : []}
                  selectedPackage={selectedPackage}
                  selectedExtras={selectedExtras}
                  onViewPackage={() => setShowPackageModal(true)}
                  currentUserId={user.id}
                />
              </div>
            </div>
            <div className="ordertracking-actions-row">
              {/* Botón de pagar: solo cliente, solo en sketch, solo si hay bocetos y favorito elegido y no pagado */}
              {user.role === 'client'
                && order.current_stage === 'sketch'
                && !order.is_paid
                && order.sketch_image // Asegúrate de tener este campo con los bocetos subidos
                && order.selected_sketch // Asegúrate de tener este campo cuando el cliente elige el favorito
                && !isFinal && (
                <button className="ordertracking-pay-btn" onClick={handlePay}>Realizar Pago</button>
              )}

              {/* Cancelar por artista (plan o sketch, no pagado, no finalizado/cancelado/rechazado) */}
              {user.role === 'artist'
                && ['plan', 'sketch'].includes(order.current_stage)
                && !order.is_paid
                && !['completed', 'cancelled', 'rejected'].includes(order.status) && (
                <button
                  className="ordertracking-cancel-btn"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancelar Pedido
                </button>
              )}

              {/* Cancelar por cliente (plan o sketch, no pagado, no finalizado/cancelado/rechazado) */}
              {user.role === 'client'
                && ['plan', 'sketch'].includes(order.current_stage)
                && !order.is_paid
                && !isFinal && (
                <button
                  className="ordertracking-cancel-btn"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancelar Pedido
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      {/* Modales de confirmación */}
      <ConfirmModal
        open={showRejectModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700, fontFamily: "'Nunito Sans', sans-serif" }}>
              Motivo de la cancelación
            </div>
            <textarea
              className="confirm-modal-textarea"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explica el motivo de la cancelación"
            />
          </div>
        }
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        onConfirm={handleReject}
        confirmText="Rechazar"
        cancelText="Cancelar"
      />

      <ConfirmModal
        open={showCancelModal}
        message={
          <div>
            <div style={{ marginBottom: 16 }}>Motivo de la cancelación</div>
            <textarea
              className="confirm-modal-textarea"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Explica el motivo de la cancelación"
            />
          </div>
        }
        onCancel={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        onConfirm={handleCancelOrder}
        confirmText="Cancelar pedido"
        cancelText="Volver"
      />
    </>
  );
};

export default OrderTracking;