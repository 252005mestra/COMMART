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
  const [sampleFiles, setSampleFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
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
  const messageListRef = useRef(null);
  const { processPayment, loading: paymentLoading, error: paymentError } = usePayment();
  const [showFinalArtModal, setShowFinalArtModal] = useState(false);

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
    // eslint-disable-next-line
  }, [order, selectedStage]);

  // ✅ useEffect para manejar preview de archivos
  useEffect(() => {
    if (!sampleFiles.length) {
      setPreviewUrls([]);
      return;
    }
    const urls = sampleFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [sampleFiles]);

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

  // ✅ useEffect para scroll a mensajes específicos (SIN FORZAR CAMBIO DE STAGE)
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
    // eslint-disable-next-line
  }, [location.state?.messageId, location.state?.phase, messages]);

  // Solo sincroniza selectedStage con la fase activa UNA VEZ al cargar el pedido
  useEffect(() => {
    if (order?.current_stage && !hasSyncedStage.current) {
      setSelectedStage(order.current_stage);
      hasSyncedStage.current = true;
    }
    // eslint-disable-next-line
  }, [order?.current_stage]);

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

  // ✅ Función para subir muestras MEJORADA
  const handleUploadSamples = async () => {
    if (!sampleFiles.length) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Selecciona al menos una imagen para subir.' 
      });
      return;
    }

    // Verificar límite de 3 archivos
    if (sampleFiles.length > 3) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: 'Máximo 3 archivos por fase.' 
      });
      return;
    }

    // Verificar que ya no exceda el límite con las muestras existentes
    const currentSamplesCount = selectedPhaseImages.length;
    if (currentSamplesCount + sampleFiles.length > 3) {
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Solo puedes subir ${3 - currentSamplesCount} imagen(es) más en esta fase.` 
      });
      return;
    }

    try {
      setAlert({ 
        open: true, 
        type: 'info', 
        message: `Subiendo ${sampleFiles.length} muestra(s)...` 
      });

      console.log('📤 Subiendo muestras:', {
        phase: selectedStage,
        fileCount: sampleFiles.length,
        orderId: order.id
      });

      // Subir cada archivo individualmente
      for (let i = 0; i < sampleFiles.length; i++) {
        const file = sampleFiles[i];
        const formData = new FormData();
        formData.append('phase', selectedStage);
        formData.append('sample_image', file);

        console.log(`📁 Subiendo archivo ${i + 1}:`, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

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

        console.log(`✅ Archivo ${i + 1} subido:`, response.data);
      }

      // Limpiar archivos seleccionados
      setSampleFiles([]);
      setPreviewUrls([]);
      
      // Recargar el pedido para ver las muestras subidas
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, { withCredentials: true });
      setOrder(res.data);
      
      setAlert({ 
        open: true, 
        type: 'success', 
        message: `✅ ${sampleFiles.length} muestra(s) subida(s) correctamente.` 
      });

    } catch (err) {
      console.error('❌ Error subiendo muestras:', err);
      console.error('❌ Error response:', err.response?.data);
      
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error al subir muestras: ${err.response?.data?.message || err.message}` 
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
        orderId: parseInt(order.id),
        amount: parseFloat(totalAmount),
        customerEmail: String(customerEmail),
        customerName: String(customerName)
      };

      // Procesar pago usando el hook
      const success = await processPayment(paymentData);

      if (!success) {
        if (paymentError) {
          setAlert({ 
            open: true, 
            type: 'error', 
            message: `Error de pago: ${paymentError}` 
          });
        } else {
          setAlert({ 
            open: true, 
            type: 'error', 
            message: 'Error procesando el pago. Por favor, intenta nuevamente.' 
          });
        }
      }
      
    } catch (err) {
      console.error('❌ Error inesperado en handlePay:', err);
      setAlert({ 
        open: true, 
        type: 'error', 
        message: `Error inesperado: ${err.message}. Por favor, intenta nuevamente.` 
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
      await reloadOrder();
      setAlert({ open: true, type: 'success', message: 'Pedido aceptado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al aceptar el pedido.' });
    }
  };

  // ✅ Función para rechazar pedido
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
                <div className="ordertracking-phase-desc-title">
                  {STAGES[getStageIndex(selectedStage)]?.label}
                  {/* ✅ Indicadores de estado de la fase */}
                  {selectedStage === order?.current_stage && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#27ae60', 
                      fontWeight: 'normal',
                      marginLeft: '8px',
                      background: '#d4edda',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      (Fase actual)
                    </span>
                  )}
                  {getStageIndex(selectedStage) < currentStageIdx && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6c757d', 
                      fontWeight: 'normal',
                      marginLeft: '8px',
                      background: '#e2e3e5',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      (Completada)
                    </span>
                  )}
                  {getStageIndex(selectedStage) > currentStageIdx && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#f39c12', 
                      fontWeight: 'normal',
                      marginLeft: '8px',
                      background: '#fff3cd',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      (Pendiente)
                    </span>
                  )}
                </div>
                {STAGES[getStageIndex(selectedStage)]?.description.split('\n').map((line, i) =>
                  <p key={i}>{line}</p>
                )}
              </div>
            </div>
            
            {/* Contenido de la fase seleccionada */}
            <div className="ordertracking-phase-content">
              
              {/* Muestras del artista - LÓGICA CORREGIDA */}
              <div className="ordertracking-section">
                <div className="ordertracking-section-title">
                  {selectedStage === 'completed' ? '🎨 Obra Final:' : 'Muestras del artista:'}
                  {isPastPhase && <small style={{ color: '#6c757d', fontWeight: 'normal' }}> (Fase completada)</small>}
                  {isFuturePhase && <small style={{ color: '#f39c12', fontWeight: 'normal' }}> (Pendiente)</small>}
                  {isCurrentPhase && <small style={{ color: '#27ae60', fontWeight: 'normal' }}> (Fase actual)</small>}
                </div>
                
                {/* FASE COMPLETED (FINALIZADO): Solo obra final */}
                {selectedStage === 'completed' ? (
                  order.completed_image ? (
                    <div className="ordertracking-final-art">
                      <div className="ordertracking-samples-list">
                        <div className="ordertracking-sample-img-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={`http://localhost:5000/${order.completed_image}`}
                            alt="Obra Final"
                            className="ordertracking-sample-img"
                            onClick={() => setShowFinalArtModal(true)}
                            style={{ cursor: 'pointer' }}
                          />
                          {/* Botón eliminar obra final - MISMO ESTILO QUE LAS MUESTRAS */}
                          {user.role === 'artist' && isCurrentPhase && order.status !== 'completed' && (
                            <button
                              className="ordertracking-delete-sample-btn"
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: '#fff',
                                border: '1px solid #e74c3c',
                                color: '#e74c3c',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: 18,
                                zIndex: 2,
                              }}
                              title="Eliminar obra final"
                              onClick={handleDeleteFinalArt}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Mensaje para el cliente */}
                      {user.id === order.client_id && (
                        <div className="ordertracking-final-art-message">
                          <p className="ordertracking-client-message">
                            Tu obra está lista. Haz clic en la imagen para verla en tamaño completo y descargarla.
                          </p>
                        </div>
                      )}
                      
                      {/* Mensaje para el artista */}
                      {user.id === order.artist_id && (
                        <div className="ordertracking-final-art-message">
                          <p className="ordertracking-artist-message">
                            Obra final entregada exitosamente. El cliente puede descargarla cuando guste.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ordertracking-no-final-art">
                      {user.role === 'artist' && isCurrentPhase ? (
                        <p className="ordertracking-message-artist">
                          Sube la obra final para completar definitivamente el pedido
                        </p>
                      ) : isFuturePhase ? (
                        <p className="ordertracking-message-future">
                          La obra final aparecerá cuando el pedido sea finalizado
                        </p>
                      ) : (
                        <p className="ordertracking-message-pending">
                          El artista aún no ha subido la obra final
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  /* TODAS LAS OTRAS FASES: Mostrar muestras */
                  selectedPhaseImages.length > 0 ? (
                    <div className="ordertracking-samples-list">
                      {selectedPhaseImages.map((img, idx) => (
                        <div key={idx} className="ordertracking-sample-img-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={`http://localhost:5000/${img}`}
                            alt={`Muestra ${idx + 1}`}
                            className="ordertracking-sample-img"
                          />
                          {user.role === 'artist' && canUploadSamples && (
                            <button
                              className="ordertracking-delete-sample-btn"
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: '#fff',
                                border: '1px solid #e74c3c',
                                color: '#e74c3c',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: 18,
                                zIndex: 2,
                              }}
                              title="Eliminar muestra"
                              onClick={() => handleDeleteSample(img, idx)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="ordertracking-no-samples">
                      {isFuturePhase 
                        ? 'Las muestras aparecerán cuando se alcance esta fase'
                        : 'Sin muestras aún'
                      }
                    </span>
                  )
                )}
              </div>
              
              {/* Subir muestras - SOLO para fases que NO sean 'completed' */}
              {canUploadSamples && selectedStage !== 'completed' && selectedStage !== 'plan' && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    Subir muestras (máx 3 por fase)
                    <small style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      fontWeight: 'normal' 
                    }}>
                      {selectedPhaseImages.length}/3 subidas en esta fase
                    </small>
                  </div>
                  
                  {/* Solo mostrar input si no ha llegado al límite */}
                  {selectedPhaseImages.length < 3 && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => {
                          const files = Array.from(e.target.files);
                          const remainingSlots = 3 - selectedPhaseImages.length;
                          const filesToAdd = files.slice(0, remainingSlots);
                          
                          if (files.length > remainingSlots) {
                            setAlert({
                              open: true,
                              type: 'warning',
                              message: `Solo puedes subir ${remainingSlots} imagen(es) más. Se seleccionaron las primeras ${remainingSlots}.`
                            });
                          }
                          
                          setSampleFiles(filesToAdd);
                        }}
                        style={{ marginBottom: '12px' }}
                      />
                      
                      {/* Vista previa de archivos seleccionados */}
                      {previewUrls.length > 0 && (
                        <div className="ordertracking-preview-list">
                          {previewUrls.map((url, idx) => (
                            <div key={idx} className="ordertracking-preview-item">
                              <img 
                                src={url} 
                                alt={`Preview ${idx + 1}`} 
                                className="ordertracking-preview-img" 
                              />
                              <button
                                onClick={() => {
                                  const newFiles = sampleFiles.filter((_, i) => i !== idx);
                                  setSampleFiles(newFiles);
                                }}
                                className="ordertracking-preview-remove"
                                title="Quitar imagen"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button 
                        className="ordertracking-upload-btn" 
                        onClick={handleUploadSamples} 
                        disabled={!sampleFiles.length}
                        style={{
                          background: sampleFiles.length ? '#8B6D47' : '#ccc',
                          cursor: sampleFiles.length ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Subir {sampleFiles.length > 0 ? `${sampleFiles.length} ` : ''}muestra{sampleFiles.length !== 1 ? 's' : ''}
                      </button>
                    </>
                  )}
                  
                  {/* Mensaje cuando ya se alcanzó el límite */}
                  {selectedPhaseImages.length >= 3 && (
                    <div style={{
                      padding: '12px',
                      background: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '6px',
                      color: '#856404'
                    }}>
                      ✅ Ya has subido el máximo de 3 muestras en esta fase.
                    </div>
                  )}
                </div>
              )}
              
              {/* ✅ SUBIR OBRA FINAL - EN LA FASE 'completed' (FINALIZADO) */}
              {user.role === 'artist' && 
                selectedStage === 'completed' && 
                isCurrentPhase && 
                order.is_paid && 
                !order.completed_image && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    🎨 Subir Obra Final
                  </div>
                  <div className="ordertracking-final-warning">
                    ⚠️ <strong>Importante:</strong> Esta será la entrega final del pedido. Una vez subida, podrás completar el pedido.
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFinalArt}
                    className="ordertracking-final-input"
                  />
                </div>
              )}

              {/* ✅ BOTÓN COMPLETAR PEDIDO - SOLO aparece después de subir obra final EN 'completed' */}
              {user.role === 'artist' && 
                selectedStage === 'completed' && 
                isCurrentPhase && 
                order.is_paid && 
                order.completed_image && 
                order.status !== 'completed' && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    ✅ Confirmar Finalización
                  </div>
                  <div className="ordertracking-complete-warning">
                    🎯 <strong>¿Estás listo para completar el pedido?</strong><br />
                    Una vez confirmado, el pedido se marcará como completado y el cliente podrá descargar la obra final.
                  </div>
                  <button
                    onClick={handleCompletePedido}
                    className="ordertracking-complete-btn"
                  >
                    🏁 Completar Pedido Definitivamente
                  </button>
                </div>
              )}

              {/* BOTÓN AVANZAR FASE - Para todas las fases excepto 'completed' */}
              {user.role === 'artist' && 
                isCurrentPhase && 
                order.is_paid && 
                selectedStage !== 'completed' && 
                (selectedStage === 'plan' || selectedPhaseImages.length > 0) && ( // ✅ Permitir avanzar desde 'plan' sin muestras
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">
                    Avanzar de Fase
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
                      {selectedStage === 'plan' && 'Pasarás a la fase de Boceto donde crearás las propuestas iniciales.'}
                      {selectedStage === 'sketch' && 'Pasarás a la fase de Definición para trabajar en los detalles.'}
                      {selectedStage === 'details' && 'Pasarás a la fase de Últimos Detalles para los ajustes finales.'}
                      {selectedStage === 'final' && 'Pasarás a la fase de Finalizado donde subirás la obra final.'}
                    </p>
                  </div>
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
                      fontWeight: 'bold'
                    }}
                  >
                    ➡️ Avanzar a {
                      selectedStage === 'plan' ? 'Boceto' :
                      selectedStage === 'sketch' ? 'Definición' :
                      selectedStage === 'details' ? 'Últimos Detalles' :
                      selectedStage === 'final' ? 'Finalizado' : 'Siguiente Fase'
                    }
                  </button>
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
                    {isFinal ? (
                      '🔒 El pedido ha finalizado. No se pueden enviar más mensajes.'
                    ) : isPastPhase ? (
                      `📝 Esta es una fase completada. Solo puedes ver los mensajes enviados anteriormente.`
                    ) : isFuturePhase ? (
                      `⏳ Esta fase aún no ha comenzado. Los mensajes aparecerán cuando se alcance esta etapa.`
                    ) : isCurrentPhase ? (
                      '✍️ Puedes enviar mensajes en esta fase actual.'
                    ) : (
                      'Solo puedes enviar mensajes en la fase actual del pedido.'
                    )}
                  </div>
                )}
              </div>

              {/* ✅ MOSTRAR MENSAJE DE PAGO EXITOSO SI YA ESTÁ PAGADO */}
              {user.id === order.client_id && order.is_paid && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Estado del pago</div>
                  <div style={{
                    padding: '12px 16px',
                    background: '#d4edda',
                    color: '#155724',
                    borderRadius: '6px',
                    border: '1px solid #c3e6cb',
                    marginBottom: '8px'
                  }}>
                    ✅ <strong>Pago completado exitosamente</strong>
                    <br />
                    <small>El artista ha sido notificado y puede continuar con tu pedido.</small>
                  </div>
                </div>
              )}


              {/* ✅ MOSTRAR FACTURA solo si el pedido está pagado */}
              {user.id === order.client_id && order.is_paid && (
                <div className="ordertracking-section">
                  <div className="ordertracking-section-title">Factura de Pago</div>
                  <button 
                    className="ordertracking-invoice-btn" 
                    onClick={handleToggleInvoice}
                    style={{
                      background: '#8B6D47',
                      color: 'white',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'Goldman, sans-serif'
                    }}
                  >
                    Ver Factura
                  </button>
                </div>
              )}
              
              {/* Subir arte final (solo artista, solo en la última fase) */}
              
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
              {/* BOTONES CON MEJOR ESPACIADO */}
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

      <InvoiceModal
        open={showInvoice}
        invoiceData={invoiceData}
        onClose={() => setShowInvoice(false)}
      />

      {/* Modal de obra final - IGUAL QUE LAS REFERENCIAS */}
      <ReferenceCarousel
        open={showFinalArtModal}
        images={order.completed_image ? [`http://localhost:5000/${order.completed_image}`] : []}
        onClose={() => setShowFinalArtModal(false)}
      />
    </>
  );
};

export default OrderTracking;