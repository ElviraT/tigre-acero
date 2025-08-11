// Almacenamiento en memoria del servidor
let serverData = {
  count: 0,
  lastReset: new Date().toDateString(),
  // Usamos un Set para almacenar IDs de sesión únicos por día
  sessions: new Set()
};

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
    if (today !== serverData.lastReset) {
      serverData.count = 1; // Empezamos en 1 para la primera visita del día
      serverData.lastReset = today;
      serverData.sessions.clear(); // Limpiar sesiones del día anterior
    }
    
    // Si es un POST, intentar incrementar el contador
    if (event.httpMethod === 'POST') {
      // Usar la IP del cliente como identificador único (puedes usar otro método si prefieres)
      const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
      const sessionId = `${today}_${clientIp}`;
      
      // Si es una sesión nueva, incrementar el contador
      if (!serverData.sessions.has(sessionId)) {
        serverData.sessions.add(sessionId);
        serverData.count++;
      }
    }
    
    // Devolver los datos actuales
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: serverData.count,
        lastReset: serverData.lastReset,
        totalSessions: serverData.sessions.size
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
  return { 
    body: JSON.stringify(JSON.parse(result.body))
  };
}

export async function post() {
  const result = await handler({ 
    httpMethod: 'POST',
    headers: {}
  });
  return { 
    body: JSON.stringify(JSON.parse(result.body))
  };
}
