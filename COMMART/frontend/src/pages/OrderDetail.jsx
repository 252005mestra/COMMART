import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import AlertModal from '../components/AlertModal';

const STAGES = [
  { key: 'plan', label: 'Planeación' },
  { key: 'sketch', label: 'Boceto' },
  { key: 'details', label: 'Detalles' },
  { key: 'final', label: 'Últimos Detalles' },
  { key: 'completed', label: 'Finalizado' }
];

const OrderDetail = ({ user }) => {
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
  const messageListRef = useRef(null);

  useEffect(() => {
    const fetchOrderAndUsers = async () => {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { withCredentials: true });
      setOrder(res.data);

      // Obtener datos de cliente y artista
      const [clientRes, artistRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/users/${res.data.client_id}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/auth/users/${res.data.artist_id}`, { withCredentials: true }),
      ]);
      setClientUser(clientRes.data);
      setArtistUser(artistRes.data);

      // Seleccionar la fase actual por defecto
      setSelectedStage(res.data.current_stage);

      setLoading(false);
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
    const reason = window.prompt('Motivo del rechazo:');
    if (!reason) return;
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'rejected', reason },
        { withCredentials: true }
      );
      await reloadOrder();
      setAlert({ open: true, type: 'success', message: 'Pedido rechazado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al rechazar el pedido.' });
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
      <div className="main-content">
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
      </div>
    );
  }

  // Cliente: solo ve detalles y mensaje si está pendiente
  if (user.id === order.client_id && order.status === 'pending') {
    return (
      <div className="main-content">
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
      </div>
    );
  }
  // Artista: ve detalles y botones si está pendiente
  if (user.id === order.artist_id && order.status === 'pending') {
    return (
      <div className="main-content">
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
            onClick={handleReject}
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
      </div>
    );
  }

  return (
    <div>
      <h2>Estado del Pedido</h2>
      {/* Navegación de fases */}
      <div style={{ marginBottom: 16 }}>
        {availableStages.map((stage, idx) => (
          <button
            key={stage.key}
            onClick={() => setSelectedStage(stage.key)}
            style={{
              fontWeight: selectedStage === stage.key ? 'bold' : 'normal',
              color: selectedStage === stage.key ? '#7d5938' : '#aaa',
              marginRight: 8,
              borderBottom: selectedStage === stage.key ? '2px solid #7d5938' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {stage.label}
          </button>
        ))}
      </div>
      <div>
        <h3>Referencias:</h3>
        {order.references_image && order.references_image.split(',').map((img, idx) => (
          <img key={idx} src={`http://localhost:5000/${img}`} alt={`Referencia ${idx + 1}`} width={100} />
        ))}
      </div>
      <div>
        <h3>Muestras del artista ({STAGES.find(s => s.key === selectedStage)?.label}):</h3>
        {selectedPhaseImages.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
            {selectedPhaseImages.map((img, idx) => (
              <img
                key={idx}
                src={`http://localhost:5000/${img}`}
                alt={`Muestra ${idx + 1}`}
                width={120}
              />
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>Sin muestras aún</span>
        )}
      </div>
      {/* Subir muestras solo si es artista, fase actual y no finalizado */}
      {canUploadSamples && (
        <div>
          <h4>Subir muestras (máx 3 por fase)</h4>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setSampleFiles(Array.from(e.target.files).slice(0, 3))}
          />
          <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
            {previewUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`Preview ${idx + 1}`} width={80} />
            ))}
          </div>
          <button onClick={handleUploadSamples} disabled={!sampleFiles.length}>Subir muestras</button>
        </div>
      )}
      {/* Comunicación */}
      <div>
        <h3>Comunicación ({STAGES.find(s => s.key === selectedStage)?.label})</h3>
        <div
          ref={messageListRef}
          style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', marginBottom: 8 }}
        >
          {messages.map((m, idx) => (
            <div
              key={m.id || idx}
              style={location.state?.messageId && String(m.id) === String(location.state.messageId)
                ? { background: '#ffe9c6', borderRadius: 6 }
                : {}}
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
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={!canSendMsg}
        />
        <button
          onClick={handleSendMsg}
          disabled={!msg.trim() || !canSendMsg}
        >
          Enviar
        </button>
        {!canSendMsg && (
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            Solo puedes enviar mensajes en la fase actual y si el pedido no está finalizado.
          </div>
        )}
      </div>
      {/* Subir arte final (solo artista, solo en la última fase) */}
      {user.role === 'artist' && order.current_stage === 'final' && !isFinal && (
        <div style={{ marginTop: 16 }}>
          <h4>Subir arte final</h4>
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
        <div>
          <h3>Descargar arte final</h3>
          <a href={`http://localhost:5000/${order.completed_image}`} download>
            Descargar arte final
          </a>
        </div>
      )}
      {/* Mostrar botón de pagar en 'plan' o 'sketch', si no está pagado ni finalizado/cancelado/rechazado */}
      {user.role === 'client'
        && ['plan', 'sketch'].includes(order.current_stage)
        && !order.is_paid
        && !isFinal && (
        <div>
          <button onClick={handlePay}>Pagar</button>
        </div>
      )}
      {/* Mostrar factura solo si el pedido está pagado */}
      {user.role === 'client' && order.is_paid && (
        <div>
          <h3>Factura</h3>
          <button onClick={handleToggleInvoice}>
            {showInvoice ? 'Ocultar' : 'Mostrar'} factura
          </button>
          {showInvoice && invoiceData && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{ background: 'white', padding: 32, borderRadius: 16, minWidth: 320 }}>
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
      {/* Cancelar por artista (solo en sketch, no pagado, no finalizado/cancelado/rechazado) */}
      {user.role === 'artist'
        && order.current_stage === 'sketch'
        && !order.is_paid
        && !isFinal && (
        <button
          style={{ background: '#e74c3c', color: 'white', marginTop: 12 }}
          onClick={async () => {
            if (window.confirm('¿Seguro que quieres cancelar este pedido por falta de pago?')) {
              try {
                await axios.put(
                  `http://localhost:5000/api/orders/${order.id}/status`,
                  { status: 'cancelled' },
                  { withCredentials: true }
                );
                setAlert({ open: true, type: 'success', message: 'Pedido cancelado.' });
                // Recarga el pedido
                const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
                setOrder(res.data);
              } catch (err) {
                setAlert({ open: true, type: 'error', message: 'Error al cancelar el pedido.' });
              }
            }
          }}
        >
          Cancelar pedido por falta de pago
        </button>
      )}
      {/* Cancelar por cliente (solo antes de sketch, no finalizado/cancelado/rechazado) */}
      {user.role === 'client'
        && ['plan'].includes(order.current_stage)
        && !isFinal && (
        <button
          style={{ background: '#e74c3c', color: 'white', marginTop: 12 }}
          onClick={async () => {
            if (window.confirm('¿Seguro que quieres cancelar este pedido?')) {
              try {
                await axios.put(
                  `http://localhost:5000/api/orders/${order.id}/status`,
                  { status: 'cancelled' },
                  { withCredentials: true }
                );
                setAlert({ open: true, type: 'success', message: 'Pedido cancelado.' });
                // Recarga el pedido
                const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
                setOrder(res.data);
              } catch (err) {
                setAlert({ open: true, type: 'error', message: 'Error al cancelar el pedido.' });
              }
            }
          }}
        >
          Cancelar pedido
        </button>
      )}
      {/* Descargar arte final (solo artista, solo si el pedido está completado y hay imagen final) */}
      {user.role === 'artist' && order.status === 'completed' && order.final_image && (
        <a
          href={`http://localhost:5000/${order.final_image}`}
          download={`arte_final_pedido_${order.id}.jpg`}
          className="download-final-art-btn"
        >
          Descargar arte final
        </a>
      )}
      {/* Solo mostrar el botón si el usuario es cliente, el pedido está en fase final y no está completado */}
      {user.id === order.client_id && order.current_stage === 'final' && order.status !== 'completed' && (
        <button onClick={handleMarkAsCompleted}>
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
            style={{ marginTop: 16, background: '#7d5938', color: 'white' }}
            onClick={handleAdvancePhase}
          >
            Avanzar a la siguiente fase
          </button>
        )
      }
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />
    </div>
  );
};

export default OrderDetail;