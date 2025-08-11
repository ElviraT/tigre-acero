// Usando el almacenamiento de Netlify Functions
let visitsData = {
  count: 0,
  lastReset: new Date().toDateString()
};

// Función para manejar la petición
export async function handler(event, context) {
  const today = new Date().toDateString();
  
  // Si es un nuevo día, reiniciar el contador
  if (today !== visitsData.lastReset) {
    visitsData.count = 0;
    visitsData.lastReset = today;
  }
  
  // Si es un POST, incrementar el contador
  if (event.httpMethod === 'POST') {
    visitsData.count++;
  }
  
  // Devolver los datos actuales
  return {
    statusCode: 200,
    body: JSON.stringify({
      count: visitsData.count,
      lastReset: visitsData.lastReset
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };
}

// Para compatibilidad con el código existente
export async function get() {
  const result = await handler({ httpMethod: 'GET' });
  return { body: result.body };
}

export async function post() {
  const result = await handler({ httpMethod: 'POST' });
  return { body: result.body };
}
