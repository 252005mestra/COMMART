// Función principal para formatear precios colombianos usando Intl API
export const formatColombianPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseInt(price.replace(/\D/g, '')) : parseInt(price);
  
  if (isNaN(numPrice) || numPrice <= 0) return '$0';
  
  // Para cantidades grandes, usar texto descriptivo
  if (numPrice >= 1000000) {
    const millions = numPrice / 1000000;
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: millions % 1 === 0 ? 0 : 1
    }).format(millions);
    return `$${formatted} ${millions === 1 ? 'millón' : 'millones'}`;
  } else if (numPrice >= 1000) {
    const thousands = Math.round(numPrice / 1000);
    return `$${thousands}mil`;
  } else {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numPrice);
  }
};

// Función para formatear mientras el usuario escribe (con separadores de miles)
export const formatPriceInput = (value) => {
  const numValue = parsePrice(value);
  if (!numValue) return '';
  
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

// Función para parsear precio ingresado por el usuario
export const parsePrice = (inputValue) => {
  if (!inputValue) return 0;
  // Remover todo lo que no sean números
  const cleanValue = inputValue.toString().replace(/\D/g, '');
  return cleanValue ? parseInt(cleanValue) : 0;
};

// Función para validar si un precio es válido
export const isValidPrice = (price, min = 1000, max = 100000000) => {
  const num = parsePrice(price.toString());
  return num >= min && num <= max;
};