// Usando una variable global para el contador
// NOTA: Esto se reiniciará cuando la función se recargue, por lo que no es persistente
let visitCount = 0;
let lastResetDate = new Date().toDateString();

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
    
    // Si es un nuevo día, reiniciar el contador
    if (today !== lastResetDate) {
      visitCount = 0;
      lastResetDate = today;
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
      
      // Incrementar el contador para cada nueva petición
      // (en un entorno real, esto debería ser atómico)
      visitCount++;
      currentCount = visitCount;
      
      console.log(`Nueva visita #${currentCount} desde ${clientIp}`);
    }
    
    // Devolver los datos actuales
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: currentCount,
        lastReset: lastResetDate,
        timestamp: new Date().toISOString()
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
