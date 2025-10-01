import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import AlertModal from '../components/AlertModal';
import OrderDataCard from '../components/OrderDataCard';
import ConfirmModal from '../components/ConfirmModal';
import { usePayment } from '../hooks/usePayment';
import InvoiceModal from '../components/InvoiceModal';
import ReferenceCarousel from '../components/ReferenceCarousel';
import { formatColombianPrice } from '../utils/priceFormatter';
import '../styles/ordertracking.css';

const STAGES = [
  { key: 'plan', label: 'Planeación', description: 'En esta fase se revisa la solicitud del pedido, incluyendo referencias, descripción y detalles generales. El objetivo es establecer una base clara para el trabajo a realizar.' },
  { key: 'sketch', label: 'Boceto', description: 'En esta fase se harán propuestas de boceto básicas para visualizar la idea inicial. El cliente podrá elegir el que más le guste.\n\nClientes estándar: 3 bocetos.\nClientes premium: 5 bocetos.' },
  { key: 'details', label: 'Definición', description: 'El artista trabaja sobre el boceto elegido, añadiendo detalles, colores, estructura y estilo definidos según el pedido.\n\nPuede subirse hasta un máximo de 3 variantes.' },
  { key: 'final', label: 'Últimos Detalles', description: 'Se realizan los ajustes finales: efectos, retoques, acabados o elementos adicionales incluidos en el paquete seleccionado.\n\nPuede subirse hasta un máximo de 3 variantes.' },
  { key: 'completed', label: 'Finalizado', description: '¡La obra está completa! El archivo final ha sido entregado y puedes descargarlo o visualizarlo desde esta sección.' }
];

function getStageIndex(key) {
  return STAGES.findIndex(s => s.key === key);
}

const OrderTracking = ({ user }) => {
  const location = useLocation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [artistUser, setArtistUser] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const hasSyncedStage = useRef(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showArtistCancelModal, setShowArtistCancelModal] = useState(false);
  const [artistCancelReason, setArtistCancelReason] = useState('');
  const messageListRef = useRef(null);
  const { processPayment, loading: paymentLoading, error: paymentError } = usePayment();
  const [showFinalArtModal, setShowFinalArtModal] = useState(false);
  const [showPackageChangeModal, setShowPackageChangeModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [availableExtras, setAvailableExtras] = useState([]);
  const [showSamplePreviewModal, setShowSamplePreviewModal] = useState(false);
  const [selectedSampleFile, setSelectedSampleFile] = useState(null);

  // ✅ useEffect para cargar datos iniciales del pedido
  useEffect(() => {
    const fetchOrderAndUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { withCredentials: true });
        setOrder(res.data);

        // ✅ CORRECCIÓN: Verificar que res.data existe antes de acceder a sus propiedades
        if (!res.data || !res.data.client_id || !res.data.artist_id) {
          console.error('Error: Datos de pedido incompletos', res.data);
          setAlert({ open: true, type: 'error', message: 'Error al cargar los datos del pedido.' });
          return;
        }

        // Obtener datos de cliente y artista
        const [clientRes, artistRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/users/${res.data.client_id}`, { withCredentials: true }),
          axios.get(`http://localhost:5000/api/auth/users/${res.data.artist_id}`, { withCredentials: true }),
        ]);

        setClientUser(clientRes.data);
        setArtistUser(artistRes.data);

        // Obtener datos del paquete
        if (res.data.package_id) {
          try {
            const packageRes = await axios.get(`http://localhost:5000/api/packages/artist/${res.data.artist_id}`, { withCredentials: true });
            const selectedPkg = packageRes.data.find(pkg => pkg.id === res.data.package_id);
            
            if (selectedPkg) {
              setSelectedPackage(selectedPkg);
            } else {
              // Crear paquete temporal si no se encuentra
              setSelectedPackage({
                id: res.data.package_id,
                title: res.data.package_name || 'Paquete',
                name: res.data.package_name || 'Paquete',
                price: res.data.total_price || 100000
              });
            }
          } catch (err) {
            console.error('Error al obtener paquete:', err);
            // Crear paquete temporal
            setSelectedPackage({
              id: res.data.package_id || 1,
              title: 'Paquete',
              name: 'Paquete',
              price: 100000
            });
          }
        } else {
          // Paquete por defecto
          setSelectedPackage({
            id: 1,
            title: 'Paquete Estándar',
            name: 'Paquete Estándar',
            price: 100000
          });
        }

        // Obtener datos de extras
        if (res.data.extras) {
          try {
            const extrasRes = await axios.get(`http://localhost:5000/api/packages/all/extras`, { withCredentials: true });
            let extrasIds = [];
            
            if (typeof res.data.extras === 'string') {
              extrasIds = res.data.extras.split(',').map(id => id.trim());
            } else if (Array.isArray(res.data.extras)) {
              extrasIds = res.data.extras;
            }
            
            const selectedExtrasData = extrasRes.data.filter(extra => 
              extrasIds.includes(String(extra.id))
            );
            setSelectedExtras(selectedExtrasData);
          } catch (err) {
            console.error('Error al obtener extras:', err);
            setSelectedExtras([]);
          }
        } else {
          setSelectedExtras([]);
        }

        setSelectedStage(res.data.current_stage || 'plan');
      } catch (err) {
        console.error('Error:', err);
        setAlert({ open: true, type: 'error', message: 'Error al cargar el pedido.' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderAndUsers();
    }
  }, [id]);

  // ✅ useEffect para cargar mensajes cuando cambia la etapa
  useEffect(() => {
    if (order && selectedStage) {
      fetchMessages(selectedStage);
    }
  }, [order, selectedStage]);


  // ✅ AGREGAR AQUÍ: Cargar paquetes y extras cuando se necesiten
  useEffect(() => {
    if ((showPackageChangeModal || showExtrasModal) && order?.artist_id) {
      loadArtistPackagesAndExtras();
    }
  }, [showPackageChangeModal, showExtrasModal, order?.artist_id]);

  // ✅ useEffect para manejar el retorno de Wompi (INTEGRACIÓN DE PAGO)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      console.log('✅ Usuario regresó de pago exitoso');
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: '¡Pago completado! Tu pedido ha sido procesado exitosamente. El artista ha sido notificado.' 
      });
      
      // Limpiar parámetros de la URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Función para recargar datos con reintentos
      const reloadOrderDataWithRetries = async (maxRetries = 5) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🔄 Intento ${attempt}/${maxRetries}: Recargando datos del pedido...`);
            
            const response = await axios.get(`http://localhost:5000/api/orders/${id}`, { 
              withCredentials: true 
            });
            
            if (response.data) {
              console.log(`📋 Datos recargados (intento ${attempt}):`, {
                is_paid: response.data.is_paid,
                paid_at: response.data.paid_at,
                status: response.data.status
              });
              
              setOrder(response.data);
              
              // Si el pago fue procesado correctamente, detener reintentos
              if (response.data.is_paid) {
                console.log('✅ Pago confirmado en la base de datos');
                return;
              } else {
                console.log(`⚠️ Intento ${attempt}: El pago aún no se refleja en la base de datos`);
              }
            }
          } catch (error) {
            console.error(`❌ Error en intento ${attempt}:`, error);
          }
          
          // Esperar antes del siguiente intento (2, 4, 6, 8, 10 segundos)
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000;
            console.log(`⏳ Esperando ${waitTime/1000} segundos antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        
        console.log('⚠️ Se agotaron los reintentos. El estado del pago podría no estar actualizado.');
      };
      
      // Iniciar proceso de recarga con delay inicial
      setTimeout(() => {
        reloadOrderDataWithRetries();
      }, 1000);
    }
  }, [location.search, id]);

  // ✅ useEffect para scroll a mensajes específicos
  useEffect(() => {
    // Solo seleccionar la fase si viene específicamente en el estado de navegación
    if (location.state?.phase && location.state.phase !== selectedStage) {
      setSelectedStage(location.state.phase);
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
  }, [location.state?.messageId, location.state?.phase, messages]);

  // ✅ Solo sincroniza selectedStage con la fase activa UNA VEZ
  useEffect(() => {
    if (order?.current_stage && !hasSyncedStage.current) {
      setSelectedStage(order.current_stage);
      hasSyncedStage.current = true;
    }
  }, [order?.current_stage]);

  // ✅ TODAS LAS FUNCIONES van después de los useEffect...

  // ✅ FUNCIÓN para obtener mensajes
  const fetchMessages = async (stage) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${id}/messages/${stage}`, { withCredentials: true });
      setMessages(res.data);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      setMessages([]);
    }
  };

  // ✅ Función para enviar mensaje
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

  // Función para avanzar de fase
  const handleAdvancePhase = async () => {
    // ✅ CORREGIR: Manejar las 5 fases correctas
    const nextPhases = {
      'plan': 'sketch',        // Planeación → Boceto
      'sketch': 'details',     // Boceto → Definición
      'details': 'final',      // Definición → Últimos Detalles  
      'final': 'completed'     // Últimos Detalles → Finalizado
      // 'completed' no tiene siguiente fase
    };

    const nextPhase = nextPhases[selectedStage];
    
    if (!nextPhase) {
      setAlert({
        open: true,
        type: 'error',
        message: 'No se puede avanzar desde esta fase.'
      });
      return;
    }

    // ✅ NOMBRES LEGIBLES para mostrar al usuario
    const phaseNames = {
      'plan': 'Planeación',
      'sketch': 'Boceto', 
      'details': 'Definición',
      'final': 'Últimos Detalles',
      'completed': 'Finalizado'
    };

    try {
      setAlert({
        open: true,
        type: 'info',
        message: `Avanzando a ${phaseNames[nextPhase]}...`
      });

      console.log(`📡 Enviando petición de avance:`, {
        orderId: order.id,
        currentStage: selectedStage,
        nextPhase: nextPhase
      });

      await axios.post(
        `http://localhost:5000/api/orders/${order.id}/advance`,
        { next_phase: nextPhase },
        { withCredentials: true }
      );

      // Recargar el pedido para ver el cambio de fase
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      // Cambiar automáticamente a la nueva fase en el frontend
      setSelectedStage(nextPhase);

      setAlert({
        open: true,
        type: 'success',
        message: `✅ Pedido avanzado exitosamente a ${phaseNames[nextPhase]}. El cliente ha sido notificado.`
      });

    } catch (err) {
      console.error('❌ Error avanzando fase:', err);
      console.error('❌ Error response:', err.response?.data);
      
      setAlert({
        open: true,
        type: 'error',
        message: `Error al avanzar de fase: ${err.response?.data?.message || err.message}`
      });
    }
  };

  // ✅ Función para finalizar pedido (cambiar status a completed)
  const handleFinalizePedido = async () => {
    if (order.current_stage !== 'final') return;
    
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'completed' },
        { withCredentials: true }
      );
      
      // Recargar el pedido para actualizar el estado
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: 'Pedido finalizado exitosamente. El cliente ha sido notificado.' 
      });
    } catch (err) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al finalizar el pedido.' 
      });
    }
  };

  // ✅ Función para mostrar/ocultar factura
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

  // ✅ FUNCIÓN PARA PROCESAR PAGO CON WOMPI
  const handlePay = async () => {
    try {
      console.log('💳 Iniciando proceso de pago...');
      
      // Validar que existe un pedido
      if (!order || !order.id) {
        setAlert({ 
          open: true, 
          type: 'error', 
          message: 'No se pudo cargar la información del pedido' 
        });
        return;
      }

      // Calcular el total
      const packagePrice = selectedPackage?.price || 0;
      const extrasPrice = selectedExtras.reduce((sum, extra) => sum + (extra.price || 0), 0);
      const totalAmount = packagePrice + extrasPrice;
      
      if (totalAmount <= 0) {
        setAlert({ 
          open: true, 
          type: 'error', 
          message: 'Error: El monto del pedido debe ser mayor a 0. Verifica que el paquete tenga precio asignado.' 
        });
        return;
      }

      // Validar datos del cliente
      const customerEmail = clientUser?.email || user?.email;
      const customerName = clientUser?.username || user?.username;

      if (!customerEmail || !customerName) {
        setAlert({ 
          open: true, 
          type: 'error', 
          message: 'Error: No se pudo obtener la información del cliente. Verifica que tu sesión esté activa.' 
        });
        return;
      }

      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Preparando pago con Wompi... Serás redirigido en un momento.' 
      });

      // Datos de pago para enviar al backend
      const paymentData = {
        orderId: order.id,
        amount: totalAmount,
        currency: 'COP',
        customerEmail: customerEmail,
        customerName: customerName,
        description: `Pago del pedido #${order.id} - ${selectedPackage?.title || 'Paquete personalizado'}`,
        // URL de retorno después del pago
        redirectUrl: `${window.location.origin}/orders/${order.id}?payment=success`
      };

      console.log('📡 Enviando datos de pago:', paymentData);

      // Procesar pago usando el hook
      await processPayment(paymentData);
      
      console.log('✅ Proceso de pago iniciado correctamente');

    } catch (error) {
      console.error('❌ Error en el proceso de pago:', error);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al procesar el pago: ${error.message || 'Intenta nuevamente.'}` 
      });
    }
  };

  // ✅ Función para recargar el pedido
  const reloadOrder = async () => {
    const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { withCredentials: true });
    setOrder(res.data);
  };

  // ✅ Función para aceptar pedido
  const handleAccept = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'accepted' },
        { withCredentials: true }
      );
      
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: 'Pedido aceptado exitosamente. El cliente ha sido notificado.' 
      });
    } catch (err) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al aceptar el pedido.' 
      });
    }
  };

  // ✅ Función para rechazar pedido
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo.' });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'rejected', rejection_reason: rejectReason },
        { withCredentials: true }
      );
      
      setShowRejectModal(false);
      setRejectReason('');
      
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: 'Pedido rechazado. El cliente ha sido notificado.' 
      });
    } catch (err) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al rechazar el pedido.' 
      });
    }
  };

  // Función para cancelar pedido
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo.' });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { 
          status: 'cancelled', 
          reason: cancelReason  // ✅ CAMBIAR DE 'cancellation_reason' A 'reason'
        },
        { withCredentials: true }
      );
      
      setShowCancelModal(false);
      setCancelReason('');
      
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: 'Pedido cancelado exitosamente.' 
      });
    } catch (err) {
      console.error('Error cancelando pedido:', err);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al cancelar el pedido: ${err.response?.data?.message || err.message}` 
      });
    }
  };

  // ✅ Función para marcar como completado (solo cliente, fase final)
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

  // ✅ Función para forzar recarga completa de datos
  const forceReloadOrderData = async () => {
    try {
      console.log('🔄 Forzando recarga completa de datos...');
      setLoading(true);
      
      const res = await axios.get(`http://localhost:5000/api/orders/${id}`, { 
        withCredentials: true 
      });
      
      if (res.data) {
        console.log('📋 Datos actualizados:', {
          id: res.data.id,
          is_paid: res.data.is_paid,
          paid_at: res.data.paid_at,
          status: res.data.status,
          current_stage: res.data.current_stage
        });
        
        setOrder(res.data);
        
        // Actualizar stage seleccionado si cambió
        if (res.data.current_stage !== selectedStage) {
          setSelectedStage(res.data.current_stage);
        }
        
        setAlert({ 
          open: true, 
          type: 'success', 
          message: 'Datos del pedido actualizados correctamente.' 
        });
      }
    } catch (error) {
      console.error('❌ Error forzando recarga:', error);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al recargar los datos del pedido.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSample = async (img, idx) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/orders/${order.id}/sample`,
        {
          data: { phase: selectedStage, image: img },
          withCredentials: true,
        }
      );
      // Recarga el pedido para actualizar las muestras
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      setAlert({ open: true, type: 'success', message: 'Muestra eliminada correctamente.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al eliminar la muestra.' });
    }
  };

  // ✅ Función para subir obra final
  const handleUploadFinalArt = async (e) => {
    const file = e.target.files[0];
    console.log('🎨 handleUploadFinalArt llamada:', { file: !!file, fileName: file?.name });
    
    if (!file) return;
    
    try {
      console.log('📤 Iniciando subida de obra final...');
      
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Subiendo obra final...' 
      });

      const formData = new FormData();
      formData.append('final_image', file);
      
      console.log('📡 Enviando petición al servidor...');
      
      const response = await axios.post(
        `http://localhost:5000/api/orders/${order.id}/final`,
        formData,
        { withCredentials: true }
      );
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      // Recargar el pedido para mostrar la obra final y el estado actualizado
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      console.log('📋 Pedido actualizado:', res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: '🎉 ¡Obra final subida correctamente! Ahora puedes completar el pedido.' 
      });
    } catch (err) {
      console.error('❌ Error subiendo obra final:', err);
      console.error('❌ Error details:', err.response?.data);
      
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al subir la obra final: ${err.response?.data?.message || err.message}` 
      });
    }
  };

  // ✅ Función para completar pedido definitivamente
  const handleCompletePedido = async () => {
    try {
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Completando pedido definitivamente...' 
      });

      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { status: 'completed' },
        { withCredentials: true }
      );
      
      // Recargar datos y cambiar a fase completed
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      setSelectedStage('completed'); // Cambiar a la fase final automáticamente
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: '🎉 ¡Pedido completado exitosamente! El cliente ha sido notificado y puede descargar la obra final.' 
      });
    } catch (err) {
      console.error('Error completando pedido:', err);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al completar el pedido. Intenta nuevamente.' 
      });
    }
  };

  // Función para eliminar obra final
  const handleDeleteFinalArt = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar la obra final?')) {
      return;
    }

    try {
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Eliminando obra final...' 
      });

      await axios.delete(
        `http://localhost:5000/api/orders/${order.id}/final`,
        { withCredentials: true }
      );
      
      // Recargar datos
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: 'Obra final eliminada correctamente.' 
      });
    } catch (err) {
      console.error('Error eliminando obra final:', err);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Error al eliminar la obra final. Intenta nuevamente.' 
      });
    }
  };

  // ✅ Función para cargar paquetes y extras disponibles del artista
  const loadArtistPackagesAndExtras = async () => {
    try {
      console.log('🔍 Cargando paquetes y extras para artista:', order.artist_id);
      
      const [packagesRes, extrasRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/packages/artist/${order.artist_id}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/packages/artist/${order.artist_id}/extras`, { withCredentials: true })
      ]);
      
      console.log('📦 Paquetes cargados:', packagesRes.data);
      console.log('✨ Extras cargados:', extrasRes.data);
      
      setAvailablePackages(packagesRes.data || []);
      setAvailableExtras(extrasRes.data || []);
    } catch (err) {
      console.error('❌ Error cargando paquetes y extras:', err);
      setAlert({ open: true, type: 'error', message: 'Error al cargar opciones disponibles.' });
    }
  };

  // ✅ Función para cambiar paquete - CORREGIDA
  const handleChangePackage = async (newPackageId) => {
    try {
      const newPackage = availablePackages.find(p => p.id === parseInt(newPackageId));
      if (!newPackage) {
        setAlert({ open: true, type: 'error', message: 'Paquete no encontrado.' });
        return;
      }

      console.log('📦 Cambiando paquete a:', newPackage);

      setSelectedPackage(newPackage);
      setShowPackageChangeModal(false);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: `Paquete cambiado a: ${newPackage.title}. Recuerda guardar los cambios.` 
      });
    } catch (err) {
      console.error('Error cambiando paquete:', err);
      setAlert({ open: true, type: 'error', message: 'Error al cambiar el paquete.' });
    }
  };

  // ✅ Función para agregar extra - CORREGIDA
  const handleAddExtra = async (extraId) => {
    try {
      const extraToAdd = availableExtras.find(e => e.id === parseInt(extraId));
      if (!extraToAdd) {
        setAlert({ open: true, type: 'error', message: 'Extra no encontrado.' });
        return;
      }

      // Verificar que no esté ya agregado
      if (selectedExtras.some(e => e.id === extraToAdd.id)) {
        setAlert({ open: true, type: 'warning', message: 'Este extra ya está incluido.' });
        setShowExtrasModal(false);
        return;
      }

      console.log('✨ Agregando extra:', extraToAdd);

      setSelectedExtras(prev => [...prev, extraToAdd]);
      setShowExtrasModal(false);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: `Extra agregado: ${extraToAdd.name}. Recuerda guardar los cambios.` 
      });
    } catch (err) {
      console.error('Error agregando extra:', err);
      setAlert({ open: true, type: 'error', message: 'Error al agregar el extra.' });
    }
  };

  // ✅ Función para quitar extra - AGREGADA
  const handleRemoveExtra = async (extraId) => {
    try {
      const extraToRemove = selectedExtras.find(e => e.id === extraId);
      if (!extraToRemove) return;

      setSelectedExtras(prev => prev.filter(e => e.id !== extraId));
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: `Extra removido: ${extraToRemove.name}. Recuerda guardar los cambios.` 
      });
    } catch (err) {
      console.error('Error removiendo extra:', err);
      setAlert({ open: true, type: 'error', message: 'Error al remover el extra.' });
    }
  };

  // ✅ Función para cancelar pedido por falta de pago (solo artista) - CORREGIDA
  const handleCancelForNonPayment = async () => {
    if (!artistCancelReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo.' });
      return;
    }

    try {
      console.log('❌ Cancelando pedido...', { stage: selectedStage, isPaid: order.is_paid });
      
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Cancelando pedido...' 
      });

      await axios.put(
        `http://localhost:5000/api/orders/${order.id}/status`,
        { 
          status: 'cancelled',
          reason: artistCancelReason  
        },
        { withCredentials: true }
      );
      
      setShowArtistCancelModal(false);
      setArtistCancelReason('');
      
      // Recargar datos
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: selectedStage === 'plan' 
          ? 'Pedido cancelado. El cliente ha sido notificado.' 
          : 'Pedido cancelado por falta de pago. El cliente ha sido notificado.'
      });
    } catch (err) {
      console.error('Error cancelando pedido:', err);
      console.error('Error response:', err.response?.data);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al cancelar el pedido: ${err.response?.data?.message || err.message}` 
      });
    }
  };

  // ✅ Función para guardar cambios de planeación
  const handleSavePlanningChanges = async () => {
    try {
      console.log('🔍 Iniciando guardado de cambios...');
      
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Guardando cambios del pedido...' 
      });

      // Preparar datos para enviar
      const extrasIds = selectedExtras.map(e => e.id).join(',');
      const packagePrice = Number(selectedPackage?.price) || 0;
      const extrasPrice = selectedExtras.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
      const totalPrice = packagePrice + extrasPrice;

      const payload = {
        package_id: selectedPackage?.id,
        package_name: selectedPackage?.title || selectedPackage?.name,
        extras: extrasIds,
        total_price: totalPrice
      };

      console.log('📡 Enviando payload:', payload);
      console.log('🔗 URL:', `http://localhost:5000/api/orders/${order.id}/planning`);

      // Verificar cookies
      console.log('🍪 Cookies disponibles:', document.cookie);

      // Enviar cambios al backend
      const response = await axios.put(
        `http://localhost:5000/api/orders/${order.id}/planning`,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      // Recargar pedido con datos actualizados
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);

      setAlert({ 
        open: true, 
        type: 'success', 
        message: '✅ Cambios guardados exitosamente. El cliente ha sido notificado y verá el nuevo precio actualizado.' 
      });

    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response headers:', err.response?.headers);
      
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al guardar cambios: ${err.response?.data?.message || err.message}` 
      });
    }
  };

  // ✅ NUEVO: Función para seleccionar muestra (cliente)
  const handleSelectSample = async (imageUrl, phase) => {
    try {
      console.log('🎯 Seleccionando muestra:', { imageUrl, phase });
      
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Seleccionando muestra...' 
      });

      await axios.post(
        `http://localhost:5000/api/orders/${order.id}/select-sample`,
        { 
          phase: phase,
          selectedImage: imageUrl.replace(`http://localhost:5000/`, '') // Solo enviar la ruta relativa
        },
        { withCredentials: true }
      );

      // Recargar el pedido para ver la selección
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: '✅ ¡Muestra seleccionada! El artista ha sido notificado.' 
      });

    } catch (err) {
      console.error('❌ Error seleccionando muestra:', err);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al seleccionar muestra: ${err.response?.data?.message || err.message}` 
      });
    }
  };

    // ✅ NUEVO: Función para manejar selección de archivo de muestra
  const handleSampleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Solo se permiten archivos de imagen.' 
      });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'La imagen no puede ser mayor a 5MB.' 
      });
      return;
    }

    setSelectedSampleFile(file);
    setShowSamplePreviewModal(true);
  };

  // ✅ NUEVO: Función para confirmar subida de muestra
  const handleConfirmSampleUpload = async () => {
    if (!selectedSampleFile) return;

    try {
      setAlert({ 
        open: true, 
        type: 'info', 
        message: 'Subiendo muestra...' 
      });

      console.log('📤 Subiendo muestra individual:', {
        phase: selectedStage,
        fileName: selectedSampleFile.name,
        orderId: order.id
      });

      const formData = new FormData();
      formData.append('phase', selectedStage);
      formData.append('sample_image', selectedSampleFile);

      const response = await axios.post(
        `http://localhost:5000/api/orders/${order.id}/sample`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('✅ Muestra subida:', response.data);

      // Cerrar modal y limpiar
      setShowSamplePreviewModal(false);
      setSelectedSampleFile(null);
      
      // Recargar el pedido para ver la muestra subida
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: '✅ Muestra subida correctamente.' 
      });

    } catch (err) {
      console.error('❌ Error subiendo muestra:', err);
      
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al subir muestra: ${err.response?.data?.message || err.message}` 
      });
    }
  };

  // ✅ LÓGICA DE PERMISOS MEJORADA
  const isFinal = ['cancelled', 'rejected', 'completed', 'finalized'].includes(order?.status);
  const currentStageIdx = order ? STAGES.findIndex(s => s.key === order.current_stage) : 0;
  const selectedStageIdx = STAGES.findIndex(s => s.key === selectedStage);

  // Permisos específicos
  const canSendMsg = !isFinal && selectedStage === order?.current_stage;
  const canUploadSamples = user?.role === 'artist' && !isFinal && selectedStage === order?.current_stage;
  const isCurrentPhase = selectedStage === order?.current_stage;
  const isPastPhase = selectedStageIdx < currentStageIdx;
  const isFuturePhase = selectedStageIdx > currentStageIdx;

  const selectedPhaseImages = order && order[`${selectedStage}_image`]
    ? order[`${selectedStage}_image`].split(',').filter(Boolean)
    : [];

  const displayImages = selectedPhaseImages;

  // ✅ Renders de estados especiales
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
            <div className="ordertracking-title">Estado del Pedido</div>
            {/* ✅ MOSTRAR TODAS LAS FASES - permitir navegar a cualquiera */}
            <div className="ordertracking-phase-card compact">
              <div className="ordertracking-phases-line">
                <div className="ordertracking-phases-line-bg" />
                {STAGES.map((stage, idx) => {
                  const isActive = order?.current_stage === stage.key; // círculo verde (fase actual)
                  const isSelected = selectedStage === stage.key; // borde negro (fase seleccionada)
                  
                  return (
                    <div
                      key={stage.key}
                      className={
                        "ordertracking-phase-item" +
                        (isActive ? " active" : "") +
                        (isSelected ? " selected" : "")
                      }
                      onClick={() => setSelectedStage(stage.key)} // ✅ Permitir clic en CUALQUIER fase
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={
                        "ordertracking-phase-circle" +
                        (isActive ? " active" : "") +
                        (isSelected ? " selected" : "")
                      } />
                      <span className="ordertracking-phase-label">{stage.label}</span>
                    </div>
                  );
                })}
              </div>
              <hr className="ordertracking-phase-divider" />
              <div className="ordertracking-phase-desc">
                {/* Etiqueta de estado arriba del título */}
                <div
                  className="ordertracking-phase-status-label"
                  style={{
                    fontFamily: 'Goldman, sans-serif',
                    fontSize: '0.9rem',
                    fontWeight: 'normal',
                    letterSpacing: '0.04em',
                    margin: '0 auto 10px auto',
                    width: '100%',
                    textAlign: 'center',
                    padding: '4px 0',
                    borderRadius: '12px',
                    background:
                      selectedStage === order?.current_stage
                        ? '#eafaf1'
                        : getStageIndex(selectedStage) < currentStageIdx
                        ? '#f8f9fa'
                        : '#fff3cd',
                    color:
                      selectedStage === order?.current_stage
                        ? '#22b573'
                        : getStageIndex(selectedStage) < currentStageIdx
                        ? '#6c757d'
                        : '#f39c12',
                    display: 'block'
                  }}
                >
                  {selectedStage === order?.current_stage && '(Fase actual)'}
                  {getStageIndex(selectedStage) < currentStageIdx && '(Completada)'}
                  {getStageIndex(selectedStage) > currentStageIdx && '(Pendiente)'}
                </div>
                <div className="ordertracking-phase-desc-title">
                  {STAGES[getStageIndex(selectedStage)]?.label}
                </div>
                {STAGES[getStageIndex(selectedStage)]?.description.split('\n').map((line, i) =>
                  <p key={i}>{line}</p>
                )}
              </div>
            </div>
            
            {/* Contenido de la fase seleccionada */}
            <div className="ordertracking-phase-content">
              
              {/* Card especial para fase de planeación - DEBAJO DE LA CARD DE FASES */}
              {selectedStage === 'plan' && user.id === order.client_id && (
                <div className="ordertracking-planning-card">
                  <h3 className="ordertracking-planning-title">¡Querido Cliente!</h3>
                  
                  <div className="ordertracking-planning-message">
                    <div className="ordertracking-planning-text">
                      Todo buen arte toma su tiempo 😊<br />
                      El artista está revisando tu pedido y creando los<br />
                      primeros bocetos.
                      <span className="ordertracking-planning-thanks">
                        ¡Gracias por tu paciencia!
                      </span>
                    </div>
                  </div>
                  
                  <div className="ordertracking-planning-characters">
                    <img 
                      src="/src/assets/1.4 Lino.png" 
                      alt="Lino" 
                      className="ordertracking-planning-character left"
                    />
                    <img 
                      src="/src/assets/2.4 Tiko.png" 
                      alt="Tiko" 
                      className="ordertracking-planning-character right"
                    />
                  </div>
                </div>
              )}

              {/* Card especial para fase de planeación - PARA ARTISTAS */}
              {selectedStage === 'plan' && user.role === 'artist' && isCurrentPhase && order.is_paid === 0 && (
                <div className="ordertracking-planning-card">
                  <h3 className="ordertracking-planning-title">¡Querido Artista!</h3>
                  
                  <div className="ordertracking-planning-message">
                    <div className="ordertracking-planning-text">
                      En esta fase inicial es crucial establecer las bases del proyecto.<br />
                      Revisa los detalles del pedido, comunícate con el cliente para<br />
                      aclarar dudas y realiza los ajustes necesarios.
                      <span className="ordertracking-planning-thanks">
                        ¡El éxito del proyecto comienza aquí!
                      </span>
                    </div>
                  </div>
                  
                  <div className="ordertracking-planning-characters">
                    <img 
                      src="/src/assets/1.4 Lino.png" 
                      alt="Lino" 
                      className="ordertracking-planning-character left"
                    />
                    <img 
                      src="/src/assets/2.4 Tiko.png" 
                      alt="Tiko" 
                      className="ordertracking-planning-character right"
                    />
                  </div>
                </div>
              )}
              

                    {/* Modal para subir muestra individual */}
                    <ConfirmModal
                      open={showSamplePreviewModal}
                      message={
                        <div>
                          <div style={{ marginBottom: 16, fontWeight: 700, fontFamily: "'Goldman', sans-serif" }}>
                            Vista Previa de Muestra
                          </div>
                          {selectedSampleFile && (
                            <div style={{ marginBottom: 16, textAlign: 'center' }}>
                              <img
                                src={URL.createObjectURL(selectedSampleFile)}
                                alt="Vista previa"
                                style={{
                                  maxWidth: '300px',
                                  maxHeight: '300px',
                                  objectFit: 'contain',
                                  border: '2px solid #8B6D47',
                                  borderRadius: '8px',
                                  background: '#f8f8f5'
                                }}
                              />
                              <div style={{ marginTop: 8, fontSize: '14px', color: '#6c757d' }}>
                                {selectedSampleFile.name}
                              </div>
                            </div>
                          )}
                          <div style={{ fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
                            ¿Deseas subir esta muestra?
                          </div>
                        </div>
                      }
                      onCancel={() => {
                        setShowSamplePreviewModal(false);
                        setSelectedSampleFile(null);
                      }}
                      onConfirm={handleConfirmSampleUpload}
                      confirmText="Subir Muestra"
                      cancelText="Cancelar"
                    />
                  
                  {/* Subir/Mostrar muestras - GRID UNIFICADO */}
                  {selectedStage !== 'plan' && selectedStage !== 'completed' && (
                    <div className="ordertracking-section">
                      <div className="ordertracking-section-title">
                        {selectedStage === 'completed' ? '🎨 Obra Final:' : 'Muestras del artista:'}
                        {canUploadSamples && (
                          <small style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            color: '#6c757d', 
                            fontWeight: 'normal' 
                          }}>
                            {selectedPhaseImages.length}/3 subidas en esta fase
                          </small>
                        )}
                      </div>
                      
                      {/* MENSAJES DE SELECCIÓN */}
                      {selectedPhaseImages.length > 0 && (
                        <>
                          {/* Mensaje para cliente - seleccionar */}
                          {user.id === order.client_id && isCurrentPhase && !order[`${selectedStage}_selected`] && (
                            <div style={{
                              background: '#e8f4fd',
                              border: '1px solid #bee5eb',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '16px'
                            }}>
                              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#0c5460' }}>
                                🎯 Selecciona tu muestra favorita
                              </p>
                              <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                                Haz clic en la muestra que más te guste. El artista será notificado de tu elección.
                              </p>
                            </div>
                          )}

                          {/* Mensaje de confirmación cuando ya seleccionó */}
                          {order[`${selectedStage}_selected`] && (
                            <div style={{
                              background: '#d4edda',
                              border: '1px solid #c3e6cb',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '16px'
                            }}>
                              <p style={{ margin: '0', fontWeight: 'bold', color: '#155724' }}>
                                ✅ {user.id === order.client_id ? 'Has seleccionado tu muestra favorita' : 'El cliente ha seleccionado una muestra'}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* GRID UNIFICADO - MUESTRAS + SLOTS PARA AGREGAR */}
                      <div className="ordertracking-samples-upload-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginTop: '1rem'
                      }}>
                        {/* Mostrar muestras existentes */}
                        {selectedPhaseImages.map((img, idx) => {
                          const fullImageUrl = `http://localhost:5000/${img}`;
                          const isSelected = order[`${selectedStage}_selected`] === img;
                          const canSelect = user.id === order.client_id && isCurrentPhase && !order[`${selectedStage}_selected`];
                          const canDeleteSample = user.role === 'artist' && canUploadSamples && !order[`${selectedStage}_selected`];
                          
                          return (
                            <div 
                              key={idx} 
                              className={`ordertracking-sample-slot ${isSelected ? 'selected' : ''} ${canSelect ? 'selectable' : ''}`}
                              style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: isSelected ? '3px solid #28a745' : '2px solid #000',
                                cursor: canSelect ? 'pointer' : 'default'
                              }}
                              onClick={() => canSelect && handleSelectSample(fullImageUrl, selectedStage)}
                              title={canSelect ? 'Clic para seleccionar esta muestra' : ''}
                            >
                              <img
                                src={fullImageUrl}
                                alt={`Muestra ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              
                              {/* Indicador de selección */}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  background: '#28a745',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                  fontWeight: 'bold',
                                  zIndex: 3
                                }}>
                                  ✓
                                </div>
                              )}

                              {/* Overlay de hover para selección */}
                              {canSelect && (
                                <div 
                                  className="ordertracking-selection-overlay"
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(40, 167, 69, 0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    zIndex: 2
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = 1}
                                  onMouseLeave={(e) => e.target.style.opacity = 0}
                                >
                                  <span style={{
                                    background: 'rgba(40, 167, 69, 0.9)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}>
                                    Seleccionar
                                  </span>
                                </div>
                              )}

                              {/* Botón eliminar (solo para artista y si no hay selección) */}
                              {canDeleteSample && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSample(img, idx);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: '#fff',
                                    border: '2px solid #e74c3c',
                                    color: '#e74c3c',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    zIndex: 4
                                  }}
                                  title="Eliminar muestra"
                                >
                                  ×
                                </button>
                              )}
                              {/* Botón de descarga para obra final */}
                                {selectedStage === 'completed' && (
                                  <a
                                    href={fullImageUrl}
                                    download={`obra_final_pedido_${order.id}.${img.split('.').pop()}`}
                                    style={{
                                      position: 'absolute',
                                      bottom: '8px',
                                      left: '8px',
                                      background: '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '32px',
                                      height: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      fontWeight: 'bold',
                                      zIndex: 4,
                                      textDecoration: 'none'
                                    }}
                                    title="Descargar obra final"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    ⬇
                                  </a>
                                )}
                            </div>
                          );
                        })}
                        
                        {/* Slots para agregar nuevas muestras (solo si el artista puede subir) */}
                        {canUploadSamples && !order[`${selectedStage}_selected`] && 
                          Array.from({ length: 3 - selectedPhaseImages.length }, (_, idx) => (
                            <div
                              key={`add-${idx}`}
                              className="ordertracking-sample-add-slot"
                              onClick={() => document.getElementById('sample-file-input').click()}
                              style={{
                                aspectRatio: '1',
                                border: '3px dashed #333',
                                borderRadius: '12px',
                                background: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                color: '#333',
                                fontFamily: "'Goldman', sans-serif",
                                fontSize: '1rem',
                                fontWeight: '500',
                                gap: '0.5rem'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#666';
                                e.target.style.background = '#f8f8f8';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = '#333';
                                e.target.style.background = '#fff';
                              }}
                            >
                              <span style={{ fontSize: '3rem', lineHeight: '1', fontWeight: 'bold' }}>+</span>
                              <span>Agregar</span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Input oculto para subir archivos */}
                      <input
                        type="file"
                        accept="image/*"
                        id="sample-file-input"
                        style={{ display: 'none' }}
                        onChange={handleSampleFileSelect}
                      />
                      
                      {/* Mensaje cuando no hay muestras */}
                      {selectedPhaseImages.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '2rem',
                          background: '#f8f9fa',
                          border: '2px dashed #dee2e6',
                          borderRadius: '12px',
                          color: '#6c757d',
                          fontFamily: "'Nunito Sans', sans-serif"
                        }}>
                          {isFuturePhase 
                            ? 'Las muestras aparecerán cuando se alcance esta fase'
                            : canUploadSamples 
                              ? 'Haz clic en "Agregar" para subir la primera muestra'
                              : 'Sin muestras aún'
                          }
                        </div>
                      )}
                      
                      {/* Mensaje informativo para artista */}
                      {canUploadSamples && selectedPhaseImages.length < 3 && !order[`${selectedStage}_selected`] && (
                        <p style={{ 
                          margin: '1rem 0 0 0', 
                          fontSize: '14px', 
                          color: '#6c757d',
                          textAlign: 'center'
                        }}>
                          Haz clic en los recuadros para agregar muestras
                        </p>
                      )}
                    </div>
                  )}

                  {/* ✅ MOSTRAR OBRA FINAL - Sección separada */}
                  {selectedStage === 'completed' && order.completed_image && (
                    <div className="ordertracking-section">
                      <div className="ordertracking-section-title">
                        🎨 Obra Final Entregada
                      </div>
                      
                      {/* Contenedor especial para obra final - MÁS GRANDE */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '1rem'
                      }}>
                        <div 
                          style={{
                            position: 'relative',
                            width: '400px',
                            height: '400px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '3px solid #28a745',
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                          }}
                          onClick={() => setShowFinalArtModal(true)}
                          title="Clic para ver en tamaño completo"
                        >
                          <img
                            src={`http://localhost:5000/${order.completed_image}`}
                            alt="Obra Final"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          
                          {/* Overlay con información */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white',
                            padding: '20px 16px 16px 16px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              🎉 Obra Finalizada
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                              Clic para ver completa
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mensaje informativo */}
                      <div style={{
                        textAlign: 'center',
                        marginTop: '1rem',
                        padding: '12px',
                        background: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        color: '#155724'
                      }}>
                        <strong>¡Pedido completado exitosamente!</strong>
                        <br />
                        <span style={{ fontSize: '14px' }}>
                          Puedes ver la obra en tamaño completo o descargarla cuando quieras.
                        </span>
                      </div>
                    </div>
                  )}

              {/* ✅ SUBIR OBRA FINAL - Solo en fase 'completed' si eres artista */}
              {selectedStage === 'completed' && user.role === 'artist' && isCurrentPhase && !order.completed_image && selectedPhaseImages.length === 0 && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    🎨 Subir Obra Final
                  </div>
                  <div style={{
                    background: '#e8f4fd',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#0c5460' }}>
                      ¡Es hora de entregar la obra final!
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                      Sube el archivo final del pedido. Una vez subido, podrás completar el pedido definitivamente.
                    </p>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFinalArt}
                    style={{ marginBottom: '12px' }}
                  />
                </div>
              )}

              {/* ✅ COMPLETAR PEDIDO - Solo si ya hay obra final */}
              {selectedStage === 'completed' && user.role === 'artist' && isCurrentPhase && order.completed_image && order.status !== 'completed' && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    ✅ Completar Pedido
                  </div>
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#155724' }}>
                      ¡Obra final subida correctamente!
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                      Ahora puedes completar el pedido definitivamente. El cliente será notificado y podrá descargar su obra.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCompletePedido}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      width: '100%'
                    }}
                  >
                    🎉 Completar Pedido Definitivamente
                  </button>
                </div>
              )}

              {/* ✅ FASE DE PLANEACIÓN - Negociación de detalles */}
              {selectedStage === 'plan' && isCurrentPhase && user.role === 'artist' && order.is_paid === 0 && (
                <div className="ordertracking-section ordertracking-planning-section">
                  <div className="ordertracking-section-title">
                    📋 Ajustar Detalles del Pedido
                  </div>
                  <div className="ordertracking-planning-info">
                    <p style={{ 
                      background: '#e8f4fd', 
                      padding: '12px', 
                      borderRadius: '6px',
                      margin: '0 0 16px 0',
                      fontSize: '14px',
                      color: '#0c5460'
                    }}>
                      💡 <strong>En esta fase puedes:</strong> Agregar extras necesarios, cambiar el paquete si el cliente lo requiere, y negociar todos los detalles antes de que realice el pago.
                    </p>
                  </div>

                  {/* Cambiar paquete */}
                  <div className="ordertracking-planning-package">
                    <div className="ordertracking-planning-subtitle">
                      🎨 Paquete Actual: <strong>{selectedPackage?.title || 'Sin paquete'}</strong>
                    </div>
                    <button
                      onClick={() => setShowPackageChangeModal(true)}
                      className="ordertracking-planning-btn"
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '8px'
                      }}
                    >
                      Cambiar Paquete
                    </button>
                  </div>

                  {/* Agregar extras */}
                  <div className="ordertracking-planning-extras">
                    <div className="ordertracking-planning-subtitle">
                      ✨ Extras Incluidos ({selectedExtras.length})
                    </div>
                    {selectedExtras.length > 0 && (
                      <div className="ordertracking-current-extras">
                        {selectedExtras.map(extra => (
                          <div key={extra.id} className="ordertracking-extra-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            background: '#f8f9fa',
                            borderRadius: '4px',
                            margin: '4px 0'
                          }}>
                            <span>{extra.name} - ${extra.price?.toLocaleString()}</span>
                            <button
                              onClick={() => handleRemoveExtra(extra.id)}
                              style={{
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginLeft: '8px'
                              }}
                              title="Quitar extra"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowExtrasModal(true)}
                      className="ordertracking-planning-btn"
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '8px'
                      }}
                    >
                      + Agregar Extras
                    </button>
                  </div>

                  {/* Total actualizado */}
                  <div className="ordertracking-planning-total">
                    <div style={{
                      background: '#f8f9fa',
                      border: '2px solid #8B6D47',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      marginTop: '16px'
                    }}>
                      <strong style={{ fontSize: '18px', color: '#8B6D47' }}>
                        Total Actualizado: {formatColombianPrice(
                          (Number(selectedPackage?.price) || 0) + 
                          selectedExtras.reduce((sum, e) => sum + (Number(e.price) || 0), 0)
                        )}
                      </strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                        Los cambios se aplicarán cuando el cliente realice el pago
                      </p>
                    </div>
                  </div>

                  {/* Botón para guardar cambios */}
                  <div className="ordertracking-planning-actions">
                    <button
                      onClick={handleSavePlanningChanges}
                      className="ordertracking-planning-save-btn"
                      style={{
                        background: '#8B6D47',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginTop: '16px',
                        width: '100%'
                      }}
                    >
                      💾 Guardar Cambios del Pedido
                    </button>
                  </div>
                </div>
              )}

              {/* BOTÓN AVANZAR FASE - Para todas las fases excepto 'completed' */}
              {user.role === 'artist' && 
                isCurrentPhase && 
                order.is_paid && 
                selectedStage !== 'completed' && 
                (
                  // ✅ CONDICIONES CORREGIDAS:
                  selectedStage === 'plan' ||                    // En planeación siempre se puede avanzar
                  (selectedPhaseImages.length > 0 && (          // En otras fases necesita muestras Y selección del cliente
                    selectedStage === 'sketch' ? order.sketch_selected :
                    selectedStage === 'details' ? order.details_selected :
                    selectedStage === 'final' ? order.final_selected :
                    true
                  ))
                ) && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    ➡️ Avanzar de Fase
                  </div>
                  <div style={{
                    background: '#e8f4fd',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                      ¿Listo para avanzar a la siguiente fase?
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                      {selectedStage === 'plan' && 'Pasarás a la fase de Boceto donde crearás las propuestas iniciales para el cliente.'}
                      {selectedStage === 'sketch' && order.sketch_selected && 'El cliente ya seleccionó su boceto favorito. Pasarás a trabajar en los detalles.'}
                      {selectedStage === 'details' && order.details_selected && 'El cliente seleccionó la variante que más le gustó. Pasarás a los últimos detalles.'}
                      {selectedStage === 'final' && order.final_selected && 'El cliente aprobó los últimos detalles. Pasarás a crear la obra final.'}
                      
                      {/* Mensajes cuando falta la selección */}
                      {selectedStage === 'sketch' && !order.sketch_selected && '⏳ Esperando a que el cliente seleccione su boceto favorito.'}
                      {selectedStage === 'details' && !order.details_selected && '⏳ Esperando a que el cliente seleccione la variante que más le guste.'}
                      {selectedStage === 'final' && !order.final_selected && '⏳ Esperando a que el cliente apruebe los últimos detalles.'}
                    </p>
                  </div>
                  
                  {/* Solo mostrar el botón si se puede avanzar */}
                  {(selectedStage === 'plan' || 
                    (selectedStage === 'sketch' && order.sketch_selected) ||
                    (selectedStage === 'details' && order.details_selected) ||
                    (selectedStage === 'final' && order.final_selected)
                  ) && (
                    <button
                      onClick={handleAdvancePhase}
                      className="ordertracking-advance-btn"
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      ➡️ Avanzar a {
                        selectedStage === 'plan' ? 'Boceto' :
                        selectedStage === 'sketch' ? 'Definición' :
                        selectedStage === 'details' ? 'Últimos Detalles' :
                        selectedStage === 'final' ? 'Finalizado' : 'Siguiente Fase'
                      }
                    </button>
                  )}
                </div>
              )}

              {/* BOTÓN CANCELAR POR FALTA DE PAGO - En fase planeación Y boceto sin pago */}
              {user.role === 'artist' && 
                (selectedStage === 'plan' || selectedStage === 'sketch') && 
                isCurrentPhase && 
                !order.is_paid && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    ⚠️ Gestión de Pago
                  </div>
                  <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404' }}>
                      {selectedStage === 'plan' 
                        ? 'El cliente aún no ha realizado el pago'
                        : 'El cliente aún no ha realizado el pago'
                      }
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                      {selectedStage === 'plan' 
                        ? 'Si no puedes llegar a un acuerdo con el cliente sobre los detalles del pedido o el cliente no responde, puedes cancelar el pedido.'
                        : 'En la fase de boceto, si el cliente no ha pagado después de ver las propuestas, puedes cancelar el pedido.'
                      } El cliente recibirá una notificación explicando el motivo.
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ CHAT - FUNDAMENTAL EN TODAS LAS FASES */}
              <div className="ordertracking-section">
                <div className="ordertracking-section-title">
                  💬 Comunicación
                  {!canSendMsg && <small style={{ color: '#6c757d', fontWeight: 'normal' }}> (Solo lectura)</small>}
                </div>
                
                {/* Lista de mensajes */}
                <div className="ordertracking-messages" ref={messageListRef}>
                  {messages.length > 0 ? (
                    messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={`ordertracking-message ${message.sender_id === user.id ? 'own' : 'other'}`}
                      >
                        <div className="ordertracking-message-header">
                          <strong>{message.sender_username}</strong>
                          <span className="ordertracking-message-time">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="ordertracking-message-text">{message.message}</div>
                      </div>
                    ))
                  ) : (
                    <p className="ordertracking-no-messages">
                      {selectedStage === 'plan' 
                        ? 'Inicia la conversación para coordinar los detalles del pedido'
                        : 'Sin mensajes en esta fase'
                      }
                    </p>
                  )}
                </div>
                
                {/* Input para enviar mensajes */}
                {canSendMsg && (
                  <div className="ordertracking-message-input">
                    <textarea
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      placeholder={selectedStage === 'plan' 
                        ? 'Escribe aquí para coordinar los detalles del pedido...'
                        : 'Escribe tu mensaje aquí...'
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMsg();
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={handleSendMsg}
                      disabled={!msg.trim()}
                      style={{
                        marginTop: '8px',
                        padding: '10px 20px',
                        background: msg.trim() ? '#8B6D47' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: msg.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Enviar mensaje
                    </button>
                  </div>
                )}
                
                {!canSendMsg && (
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    color: '#6c757d',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {isFinal 
                      ? 'La comunicación está cerrada en pedidos finalizados'
                      : 'Solo puedes enviar mensajes en la fase actual'
                    }
                  </div>
                )}
              </div>
            </div>
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
                  clientUser={clientUser}
                  artistUser={artistUser}
                  images={order.references_image ? order.references_image.split(',').map(img => `http://localhost:5000/${img}`) : []}
                  selectedPackage={selectedPackage || { id: 1, title: 'Paquete', name: 'Paquete', price: 100000 }}
                  selectedExtras={selectedExtras || []}
                  onViewPackage={() => setShowPackageModal(true)}
                  currentUserId={user.id}
                  currentUser={user}
                />
              </div>
              
              {/* BOTONES PARA CLIENTE - PAGAR Y CANCELAR */}
              {(order.status === 'accepted' || order.status === 'in_progress' || order.status === 'plan' || order.status === 'sketch') && !order.is_paid && user.id === order.client_id && (
                <div className="ordertracking-actions-row">
                  <button
                    className="ordertracking-cancel-btn"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancelar pedido
                  </button>
                  <button
                    className="ordertracking-pay-btn"
                    onClick={handlePay}
                  >
                    Realizar Pago
                  </button>
                </div>
              )}

              {/* BOTÓN PARA ARTISTA - CANCELAR POR FALTA DE PAGO */}
              {user.role === 'artist' && 
                (selectedStage === 'plan' || selectedStage === 'sketch') && 
                isCurrentPhase && 
                !order.is_paid && (
                <div className="ordertracking-actions-row">
                  <button
                    className="ordertracking-cancel-btn"
                    onClick={() => setShowArtistCancelModal(true)}
                  >
                    {selectedStage === 'plan' ? 'Cancelar Pedido' : 'Cancelar por Falta de Pago'}
                  </button>
                  
                  {/* Espacio vacío para mantener el layout */}
                  <div style={{ width: '1px' }}></div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      
      {/* Modal de obra final - IGUAL QUE LAS REFERENCIAS */}
      <ReferenceCarousel
        open={showFinalArtModal}
        images={order.completed_image ? [`http://localhost:5000/${order.completed_image}`] : []}
        onClose={() => setShowFinalArtModal(false)}
      />

      {/* Modal para cambiar paquete */}
      <ConfirmModal
        open={showPackageChangeModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700 }}>
              Cambiar Paquete del Pedido
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Seleccionar nuevo paquete:
              </label>
              <select
                id="package-select"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                defaultValue=""
              >
                <option value="" disabled>Selecciona un paquete</option>
                {availablePackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title || pkg.name} - ${pkg.price?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        onCancel={() => setShowPackageChangeModal(false)}
        onConfirm={() => {
          const select = document.getElementById('package-select');
          if (select.value) {
            handleChangePackage(select.value);
          } else {
            setAlert({ open: true, type: 'warning', message: 'Selecciona un paquete.' });
          }
        }}
        confirmText="Cambiar Paquete"
        cancelText="Cancelar"
      />

      {/* Modal para agregar extras */}
      <ConfirmModal
        open={showExtrasModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700 }}>
              Agregar Extras al Pedido
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Seleccionar extra:
              </label>
              <select
                id="extras-select"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                defaultValue=""
              >
                <option value="" disabled>Selecciona un extra</option>
                {availableExtras
                  .filter(extra => !selectedExtras.some(se => se.id === extra.id))
                  .map(extra => (
                    <option key={extra.id} value={extra.id}>
                      {extra.name} - ${extra.price?.toLocaleString()}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        }
        onCancel={() => setShowExtrasModal(false)}
        onConfirm={() => {
          const select = document.getElementById('extras-select');
          if (select.value) {
            handleAddExtra(select.value);
            setShowExtrasModal(false);
          } else {
            setAlert({ open: true, type: 'warning', message: 'Selecciona un extra.' });
          }
        }}
        confirmText="Agregar Extra"
        cancelText="Cancelar"
      />

      {/* Modal para cancelar pedido del artista */}
      <ConfirmModal
        open={showArtistCancelModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700, fontFamily: "'Nunito Sans', sans-serif" }}>
              {selectedStage === 'plan' ? 'Cancelar Pedido' : 'Cancelar por Falta de Pago'}
            </div>
            <div style={{ marginBottom: 12, fontSize: '14px', color: '#6c757d' }}>
              {selectedStage === 'plan' 
                ? 'Motivos comunes: No se llegó a un acuerdo, el cliente no responde, problemas de comunicación.'
                : 'El cliente no ha realizado el pago después de ver las propuestas.'
              }
            </div>
            <textarea
              className="confirm-modal-textarea"
              value={artistCancelReason}
              onChange={(e) => setArtistCancelReason(e.target.value)}
              placeholder="Explica el motivo de la cancelación..."
            />
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
              Esta acción no se puede deshacer. El cliente será notificado de la cancelación.
            </div>
          </div>
        }
        onCancel={() => {
          setShowArtistCancelModal(false);
          setArtistCancelReason('');
        }}
        onConfirm={handleCancelForNonPayment}
        confirmText="Cancelar Pedido"
        cancelText="Mantener Pedido"
      />

      {/* Modal para cancelar pedido del cliente - MODIFICADO */}
      <ConfirmModal
        open={showCancelModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700, fontFamily: "'Nunito Sans', sans-serif" }}>
              Cancelar Pedido
            </div>
            <textarea
              className="confirm-modal-textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explica por qué quieres cancelar el pedido..."
            />
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
              Esta acción no se puede deshacer. El artista será notificado de la cancelación.
            </div>
          </div>
        }
        onCancel={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        onConfirm={handleCancelOrder}
        confirmText="Cancelar Pedido"
        cancelText="Mantener Pedido"
      />

      {/* Modal de factura */}
      {showInvoice && invoiceData && (
        <InvoiceModal
          open={showInvoice}
          invoiceData={invoiceData}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* Modal de alertas */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

      <Footer />
    </>
  );
};

export default OrderTracking;