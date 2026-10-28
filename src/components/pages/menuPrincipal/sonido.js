import { DURACION, EASING } from "./ruedaUtils";

// Sonidos de la ruleta generados con Web Audio (sin archivos). Se pueden silenciar y la preferencia se recuerda.
const CLAVE = "pk_sonido";
let contexto = null;

export const leerSonido = () => {
  try { return localStorage.getItem(CLAVE) !== "off"; } catch { return true; }
};
export const guardarSonido = (activo) => {
  try { localStorage.setItem(CLAVE, activo ? "on" : "off"); } catch { /* sin almacenamiento: no pasa nada */ }
};

const audio = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  contexto = contexto || new Ctx();
  if (contexto.state === "suspended") contexto.resume();
  return contexto;
};

const nota = (ctx, inicio, frecuencia, duracion, volumen, tipo = "triangle") => {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, inicio);
  ganancia.gain.setValueAtTime(0.0001, inicio);
  ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.005);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(ganancia).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.02);
};

// Curva cubic-bezier igual a la de la animación CSS: dado el avance recorrido (0..1) devuelve en qué momento (0..1) ocurre
const [x1, y1, x2, y2] = EASING;
const curva = (t, p1, p2) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
const tiempoParaAvance = (avance) => {
  let bajo = 0;
  let alto = 1;
  for (let i = 0; i < 30; i++) {
    const medio = (bajo + alto) / 2;
    if (curva(medio, y1, y2) < avance) bajo = medio; else alto = medio;
  }
  return curva((bajo + alto) / 2, x1, x2);
};

// Un "tic" cada vez que una porción pasa bajo la flecha; al final la rueda va más lenta y los tics se espacian
export const programarTicks = (giroInicial, giroFinal, porciones) => {
  const ctx = audio();
  if (!ctx) return;
  const paso = 360 / porciones;
  const inicio = ctx.currentTime + 0.05;
  let anterior = -1;
  for (let k = Math.ceil(giroInicial / paso); k * paso <= giroFinal; k++) {
    const avance = (k * paso - giroInicial) / (giroFinal - giroInicial);
    const momento = tiempoParaAvance(avance) * (DURACION / 1000);
    if (momento - anterior < 0.035) continue; // al inicio van muy rápido: no amontonar
    anterior = momento;
    nota(ctx, inicio + momento, 900 + Math.random() * 120, 0.04, 0.12, "square");
  }
};

export const fanfarria = () => {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.05;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(ctx, t + i * 0.11, f, 0.32, 0.22));
  nota(ctx, t + 0.5, 1318.5, 0.6, 0.18, "sine");
};

// Pago enviado: arpegio ascendente corto con un brillo al final
export const sonidoPagoEnviado = () => {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.05;
  [659.25, 880, 1108.7].forEach((f, i) => nota(ctx, t + i * 0.09, f, 0.28, 0.2));
  nota(ctx, t + 0.32, 1760, 0.5, 0.1, "sine");
};
