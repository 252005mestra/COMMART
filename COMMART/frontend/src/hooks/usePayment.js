import { useState } from 'react';
import { createPaymentSession, redirectToWompi } from '../services/paymentService';

/**
 * Hook personalizado para manejar pagos
 * @returns {Object} Funciones y estado del pago
 */
export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Procesar pago
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<boolean>} True si el pago se inició correctamente
   */
  const processPayment = async (paymentData) => {
    try {
      console.log('🔥 [HOOK] === INICIO processPayment ===');
      console.log('🔥 [HOOK] paymentData recibido:', JSON.stringify(paymentData, null, 2));
      
      setLoading(true);
      setError(null);
      
      console.log('🔄 [HOOK] Iniciando proceso de pago...');
      console.log('🔥 [HOOK] Loading establecido a true, error limpiado');
      
      // Validar datos de entrada
      console.log('🔥 [HOOK] Validando datos de entrada...');
      if (!paymentData) {
        throw new Error('No se proporcionaron datos de pago');
      }
      
      const requiredFields = ['orderId', 'amount', 'customerEmail', 'customerName'];
      const missingFields = requiredFields.filter(field => {
        const value = paymentData[field];
        const isMissing = !value || value === null || value === undefined || value === '';
        if (isMissing) {
          console.error(`🔥 [HOOK] Campo faltante: ${field} = ${value}`);
        } else {
          console.log(`🔥 [HOOK] Campo válido: ${field} = ${value}`);
        }
        return isMissing;
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ [HOOK] Validación de entrada exitosa');
      
      // Crear sesión en el backend
      console.log('🔥 [HOOK] Llamando createPaymentSession...');
      const sessionData = await createPaymentSession(paymentData);
      console.log('🔥 [HOOK] createPaymentSession completado');
      console.log('🔥 [HOOK] sessionData recibido:', JSON.stringify(sessionData, null, 2));
      
      // Validar sessionData
      console.log('🔥 [HOOK] Validando sessionData...');
      if (!sessionData) {
        throw new Error('No se recibieron datos de sesión del backend');
      }
      
      const sessionRequiredFields = ['public_key', 'currency', 'amount_in_cents', 'reference'];
      const sessionMissingFields = sessionRequiredFields.filter(field => {
        const value = sessionData[field];
        const isMissing = !value || value === null || value === undefined || value === '';
        if (isMissing) {
          console.error(`🔥 [HOOK] Campo de sesión faltante: ${field} = ${value}`);
        } else {
          console.log(`🔥 [HOOK] Campo de sesión válido: ${field} = ${value}`);
        }
        return isMissing;
      });
      
      if (sessionMissingFields.length > 0) {
        throw new Error(`Datos de sesión incompletos: ${sessionMissingFields.join(', ')}`);
      }
      
      console.log('✅ [HOOK] Validación de sessionData exitosa');
      
      // Redireccionar a Wompi
      console.log('🔥 [HOOK] Llamando redirectToWompi...');
      redirectToWompi(sessionData);
      console.log('🔥 [HOOK] redirectToWompi completado');
      
      console.log('✅ [HOOK] === FIN processPayment (SUCCESS) ===');
      return true;
      
    } catch (err) {
      console.error('🔥 [HOOK] === ERROR EN processPayment ===');
      console.error('🔥 [HOOK] Error completo:', err);
      console.error('🔥 [HOOK] Error.message:', err.message);
      console.error('🔥 [HOOK] Error.stack:', err.stack);
      
      console.error('❌ [HOOK] Error procesando pago:', err);
      setError(err.message);
      return false;
    } finally {
      console.log('🔥 [HOOK] Estableciendo loading a false');
      setLoading(false);
    }
  };

  /**
   * Limpiar errores
   */
  const clearError = () => {
    console.log('🔥 [HOOK] clearError llamado');
    setError(null);
  };

  return {
    loading,
    error,
    processPayment,
    clearError
  };
};