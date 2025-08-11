// Usando una variable global para el contador
// NOTA: Esto se reiniciará cuando la función se recargue, por lo que no es persistente
let visitCount = 1; // Empezamos en 1 para la primera visita
let lastResetDate = new Date().toDateString();

// Función para inicializar el contador si es un nuevo día
function initializeCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    visitCount = 1; // Reiniciar a 1 para el nuevo día
    lastResetDate = today;
    console.log('Contador reiniciado para el nuevo día:', today);
  } else if (visitCount === 0) {
    // Si por alguna razón el contador está en 0, lo establecemos en 1
    visitCount = 1;
    console.log('Contador corregido a 1');
  }
}

// Inicializar el contador al cargar
initializeCounter();

// Función para manejar la petición
export async function handler(event) {
  // Configurar CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Manejar solicitud OPTIONS para CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const today = new Date().toDateString();
    
    // Verificar y reiniciar contador si es necesario
    if (today !== lastResetDate) {
      visitCount = 0;
      lastResetDate = today;
      console.log('Nuevo día detectado, contador reiniciado');
    }
    
    // Si es un POST, incrementar el contador
    let currentCount = visitCount;
    if (event.httpMethod === 'POST') {
      // Usar una marca de tiempo para hacer el ID más único
      const timestamp = Date.now();
      // Usar la IP del cliente si está disponible
      const clientIp = event.headers['x-nf-client-connection-ip'] || 
                      event.headers['x-forwarded-for'] || 
                      'unknown';
      
      // Generar un ID único para esta visita
      const visitId = `${today}_${clientIp}_${timestamp}`;
      
      // Asegurarse de que el contador se incremente correctamente
      // Siempre incrementar el contador
      visitCount++;
      currentCount = visitCount;
      
      // Asegurarse de que el contador nunca sea menor a 1
      if (currentCount < 1) {
        currentCount = 1;
        visitCount = 1;
      }
      
      console.log(`Contador incrementado a: ${currentCount}`);
      
      console.log(`Nueva visita #${currentCount} desde ${clientIp}`);
    }
    
    // Asegurarse de que el contador sea al menos 1
    const finalCount = currentCount < 1 ? 1 : currentCount;
    
    // Devolver los datos actuales
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: finalCount,
        lastReset: lastResetDate,
        timestamp: new Date().toISOString(),
        message: 'Contador actualizado correctamente'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al procesar la solicitud',
        details: error.message 
      })
    };
  }
}

// Para compatibilidad con el código existente
export async function get() {
  const result = await handler({ 
    httpMethod: 'GET',
    headers: {}
  });
  
  // Parsear el body si es una cadena
  const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
  
  return { 
    body: body,
    statusCode: result.statusCode,
    headers: result.headers
  };
}

export async function post() {
  const result = await handler({ 
    httpMethod: 'POST',
    headers: {}
  });
  
  // Parsear el body si es una cadena
  const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
  
  return { 
    body: body,
    statusCode: result.statusCode,
    headers: result.headers
  };
}
