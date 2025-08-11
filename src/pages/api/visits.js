// Este endpoint cuenta las visitas diarias
let dailyVisits = 0;
let lastReset = new Date().toDateString();

export async function get() {
  const today = new Date().toDateString();
  
  // Reiniciar el contador si es un nuevo día
  if (today !== lastReset) {
    dailyVisits = 0;
    lastReset = today;
  }
  
  return {
    body: JSON.stringify({
      count: dailyVisits,
      lastReset: lastReset
    })
  };
}

export async function post() {
  const today = new Date().toDateString();
  
  // Reiniciar el contador si es un nuevo día
  if (today !== lastReset) {
    dailyVisits = 0;
    lastReset = today;
  }
  
  // Incrementar el contador
  dailyVisits++;
  
  return {
    body: JSON.stringify({
      count: dailyVisits,
      lastReset: lastReset
    })
  };
}
