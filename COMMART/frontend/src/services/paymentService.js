import axios from 'axios';

const API_URL = 'http://localhost:5000/api/payments';

/**
 * Crear sesión de pago en el backend
 */
export const createPaymentSession = async (paymentData) => {
  try {
    console.log('💳 [FRONTEND] Enviando datos al backend:', paymentData);
    
    const response = await axios.post(`${API_URL}/create-session`, paymentData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 [FRONTEND] Respuesta del backend:', response.data);
    
    if (response.data.success) {
      const sessionData = response.data.data;
      
      // Validar que todos los campos necesarios estén presentes
      const requiredFields = ['public_key', 'currency', 'amount_in_cents', 'reference'];
      const missingFields = requiredFields.filter(field => {
        const value = sessionData[field];
        return !value || value === null || value === undefined || value === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`El backend no devolvió campos requeridos: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ [FRONTEND] Sesión validada correctamente');
      return sessionData;
      
    } else {
      throw new Error(response.data.message || 'Error creando sesión de pago');
    }
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en createPaymentSession:', error);
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Error del servidor');
    } else if (error.request) {
      throw new Error('Error de conexión. Verifica tu internet.');
    } else {
      throw new Error(error.message || 'Error desconocido');
    }
  }
};

/**
 * Redireccionar a la pasarela de pago de Wompi
 * 🔧 USANDO EL MÉTODO CORRECTO DE WOMPI (URL CON PARÁMETROS)
 */
export const redirectToWompi = (paymentData) => {
  try {
    console.log('🚀 [FRONTEND] Redirigiendo a Wompi con datos:', paymentData);
    
    // Validación de campos requeridos
    const requiredFields = ['public_key', 'currency', 'amount_in_cents', 'reference'];
    const missingFields = requiredFields.filter(field => {
      const value = paymentData[field];
      return !value || value === null || value === undefined || value === '' || value === 'undefined';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Campos faltantes: ${missingFields.join(', ')}`);
    }

    // 🔧 CONSTRUIR URL CON PARÁMETROS (MÉTODO CORRECTO DE WOMPI)
    const baseUrl = 'https://checkout.wompi.co/p/';
    const params = new URLSearchParams();

    // Agregar parámetros principales
    params.append('public-key', paymentData.public_key);
    params.append('currency', paymentData.currency);
    params.append('amount-in-cents', paymentData.amount_in_cents);
    params.append('reference', paymentData.reference);

    // Agregar parámetros opcionales
    if (paymentData.redirect_url) {
      params.append('redirect-url', paymentData.redirect_url);
    }

    // Agregar firma de integridad
    if (paymentData.signature?.integrity) {
      params.append('signature:integrity', paymentData.signature.integrity);
    }

    // Agregar datos del cliente
    if (paymentData.customer_data) {
      if (paymentData.customer_data.email) {
        params.append('customer-data:email', paymentData.customer_data.email);
      }
      if (paymentData.customer_data.full_name) {
        params.append('customer-data:full_name', paymentData.customer_data.full_name);
      }
      if (paymentData.customer_data.phone_number) {
        params.append('customer-data:phone_number', paymentData.customer_data.phone_number);
      }
    }

    // Construir URL final
    const finalUrl = `${baseUrl}?${params.toString()}`;

    console.log('📋 [FRONTEND] URL final de Wompi:');
    console.log(finalUrl);

    // Mostrar parámetros para debugging
    console.log('📋 [FRONTEND] Parámetros enviados:');
    for (let [key, value] of params.entries()) {
      console.log(`  ✓ ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    }

    // Verificar que public-key esté presente
    const publicKeyValue = params.get('public-key');
    if (!publicKeyValue || publicKeyValue === 'undefined') {
      throw new Error(`❌ Public key es inválido: ${publicKeyValue}`);
    }

    console.log(`✅ [FRONTEND] Public key verificada: ${publicKeyValue.substring(0, 15)}...`);

    // 🚀 REDIRECCIONAR DIRECTAMENTE A LA URL
    console.log('🎯 [FRONTEND] Redirigiendo a Wompi checkout...');
    
    // Redirección inmediata
    window.location.href = finalUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error crítico en redirectToWompi:', error);
    throw error;
  }
};

/**
 * Verificar estado del servicio de pagos
 */
export const checkPaymentServiceHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data.success;
  } catch (error) {
    console.error('❌ [FRONTEND] Servicio de pagos no disponible:', error);
    return false;
  }
};