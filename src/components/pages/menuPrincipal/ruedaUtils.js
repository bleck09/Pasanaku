export const COLORES = ["#4A8FD6", "#2E9A6B", "#8E74D4", "#E0A03F", "#3F9BB8", "#CE7FAA", "#6E8BE0", "#74B25A"];
export const DURACION = 5500;
export const EASING = [0.12, 0.6, 0.1, 1]; // cubic-bezier de la animación de giro

// Número entero al azar con aleatoriedad criptográfica
export const aleatorio = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;

// Elige al azar quién sale y calcula el ángulo final para que la flecha (arriba) quede sobre esa porción
// `idxForzado`: para un lugar pedido la rueda gira igual pero se detiene en la persona que lo pidió
export const prepararGiro = (n, giroActual, idxForzado, permitidos) => {
  const a = 360 / n;
  const idx = idxForzado ?? (permitidos ? permitidos[aleatorio(permitidos.length)] : aleatorio(n));
  const desvio = (Math.random() - 0.5) * a * 0.7; // no cae siempre en el centro de la porción
  const objetivo = (((360 - ((idx + 0.5) * a + desvio)) % 360) + 360) % 360;
  const actual = ((giroActual % 360) + 360) % 360;
  return { idx, giro: giroActual + 360 * 6 + ((objetivo - actual + 360) % 360) };
};

// Arma el orden final: primero los lugares fijados (pedidos) y los demás se llenan con quienes fueron saliendo en la ruleta.
// Devuelve una lista de `total` lugares: { id, fijo } o null si ese lugar aún no se sortea.
export const construirOrden = (total, fijas, sorteados) => {
  const orden = Array(total).fill(null);
  fijas.forEach((f) => { orden[f.pos - 1] = { id: f.id, fijo: true }; });
  let k = 0;
  for (let i = 0; i < total && k < sorteados.length; i++) {
    if (!orden[i]) orden[i] = { id: sorteados[k++], fijo: false };
  }
  return orden;
};

// Estado del sorteo lugar por lugar (1, 2, 3...). `colocados` son los ids ya ubicados, en orden.
// - Un lugar pedido (fijas) se resuelve con un giro que se detiene en quien lo pidió.
// - Hasta el último lugar se gira: si queda una sola persona, la rueda tiene una sola porción.
export const estadoSorteo = (personas, fijas, colocados) => {
  const total = personas.length;
  const reservados = new Set(fijas.map((f) => f.id));
  const col = [...colocados];
  const sinColocar = () => personas.filter((p) => !col.includes(p.id));

  const posicion = col.length + 1;
  const fija = fijas.find((f) => f.pos === posicion) || null;
  // En la rueda aparecen todos los que aún no tienen lugar; quienes tienen un lugar pedido más adelante salen marcados (reservado) y no pueden salir en este giro
  const rueda = sinColocar().map((p) => ({ ...p, reservado: reservados.has(p.id) && !(fija && p.id === fija.id) }));
  const sorteadosLibres = col.filter((id) => !reservados.has(id));
  return { colocados: col, rueda, fija, posicion, completo: col.length >= total, orden: construirOrden(total, fijas, sorteadosLibres) };
};

// Pares de colores (claro → intenso) para las porciones de la rueda: dan volumen sin verse recargadas
export const GRADIENTES = [
  ["#8EA8FF", "#4F6BED"], ["#5FD9B0", "#1FA37A"], ["#C3A2FA", "#7C4DDB"], ["#FFCE7A", "#F2A006"],
  ["#6ED0EE", "#1C9DC4"], ["#FF9DBB", "#E0508A"], ["#9DB4FF", "#5A74E8"], ["#A9E48C", "#4FAF47"],
];
