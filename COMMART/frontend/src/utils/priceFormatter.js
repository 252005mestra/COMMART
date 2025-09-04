// Función principal para formatear precios colombianos usando Intl API
export const formatColombianPrice = (price) => {
  // Convertir SIEMPRE a número decimal
  let numPrice = 0;

  if (typeof price === 'string') {
    // Permitir decimales correctamente
    numPrice = parseFloat(price.replace(/,/g, '.'));
  } else if (typeof price === 'number') {
    numPrice = price;
  }

  if (isNaN(numPrice) || numPrice <= 0) return '$0';

  // Mostrar millones si corresponde
  if (numPrice >= 1000000) {
    const millions = numPrice / 1000000;
    if (Number.isInteger(millions)) {
      return `${millions} ${millions === 1 ? 'millón' : 'millones'} COP$`;
    } else {
      return `${millions.toLocaleString('es-CO', { maximumFractionDigits: 2 })} millones COP$`;
    }
  } else if (numPrice >= 1000) {
    const thousands = numPrice / 1000;
    // Mostrar con decimales si los tiene
    return `${thousands % 1 === 0 ? thousands : thousands.toLocaleString('es-CO', { maximumFractionDigits: 2 })}mil COP$`;
  } else {
    // Mostrar el valor exacto con dos decimales
    return `$${numPrice.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP$`;
  }
};

// Función para formatear mientras el usuario escribe (con separadores de miles)
export const formatPriceInput = (value) => {
  if (!value) return '';
  
  // Limpiar solo caracteres no numéricos
  const cleanValue = value.toString().replace(/\D/g, '');
  if (!cleanValue) return '';
  
  const numValue = parseInt(cleanValue);
  if (isNaN(numValue) || numValue === 0) return '';
  
  // Formatear con puntos como separadores de miles colombianos
  return new Intl.NumberFormat('es-CO').format(numValue);
};

// Función para parsear precio ingresado por el usuario
export const parsePrice = (inputValue) => {
  if (!inputValue) return 0;
  
  // Convertir a string y limpiar
  const stringValue = inputValue.toString();
  const cleanValue = stringValue.replace(/\D/g, '');
  
  if (!cleanValue) return 0;
  
  const parsed = parseInt(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Función para convertir a decimal para la base de datos
export const parsePriceForDB = (inputValue) => {
  const integerPrice = parsePrice(inputValue);
  // Convertir a decimal con 2 decimales
  return parseFloat(integerPrice.toFixed(2));
};

// Función para validar si un precio es válido
export const isValidPrice = (price, min = 1000, max = 100000000) => {
  const num = parsePrice(price.toString());
  return num >= min && num <= max;
};