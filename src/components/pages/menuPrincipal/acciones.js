import toast from "react-hot-toast";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { confirmar } from "./Confirmar";
import { hashClave, ITERACIONES } from "./claves";

// Cuántos participantes faltan para completar el grupo (0 si ya está completo)
export const faltanParticipantes = (grupo, cantidad) => (grupo.cupos ? Math.max(0, grupo.cupos - cantidad) : 0);

// Para iniciar hacen falta: el grupo completo, el orden de cobro definido (ruleta o manual) y el QR de pago subido
export const pendientesInicio = (grupo, cantidad) => [
  { id: "participantes", texto: grupo.cupos ? `Participantes completos (${cantidad} de ${grupo.cupos})` : `Al menos 2 participantes (${cantidad})`, hecho: cantidad >= 2 && faltanParticipantes(grupo, cantidad) === 0 },
  { id: "orden", texto: "Orden de cobro definido", hecho: Boolean(grupo.ordenListo) },
  { id: "qr", texto: "QR de pago subido", hecho: Boolean(grupo.qrListo) },
];

export const puedeIniciar = (grupo, cantidad) => pendientesInicio(grupo, cantidad).every((p) => p.hecho);

// Inicia el pasanaku: desde ese momento ya no se pueden cambiar los participantes ni el orden
export const iniciarPasanaku = async (grupo) => {
  const ok = await confirmar({
    titulo: `¿Iniciar "${grupo.nombre}"?`,
    mensaje: "Después de iniciar no podrás agregar, quitar ni cambiar el orden de los participantes.",
    textoConfirmar: "Sí, iniciar",
  });
  if (!ok) return;
  try {
    await updateDoc(doc(db, "pasanakus", grupo.id), { iniciado: true, estado: "activo", rondaActual: 1, iniciadoEn: Date.now() });
    toast.success("¡Pasanaku iniciado!");
  } catch {
    toast.error("No se pudo iniciar.");
  }
};

/* ---------------- Usuarios y contraseñas ----------------
   Solo el administrador usa Firebase Authentication (correo + contraseña).
   Los jugadores viven en la colección "jugadores": el id del documento es su usuario (único) y su contraseña
   se guarda como hash con sal (ver claves.js). Nadie puede ver una contraseña; el administrador solo puede
   reemplazarla. */

// "María José" → "maria.jose" (minúsculas, sin tildes ni símbolos)
export function normalizarUsuario(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 20);
}

// Propone un usuario libre: wendy, wendy2, wendy3...
export const sugerirUsuario = (nombre, jugadores) => {
  const base = normalizarUsuario(nombre);
  if (!base) return "";
  const tomados = new Set(jugadores.map((j) => (j.usuario || j.id || "").toLowerCase()));
  let candidato = base;
  for (let i = 2; tomados.has(candidato); i++) candidato = `${base.slice(0, 18)}${i}`;
  return candidato;
};

// Cada persona elige la contraseña que quiera
export const validarClave = (clave) => (clave.length < 4 ? "Debe tener al menos 4 caracteres." : null);

// Contraseña temporal aleatoria (criptográfica), sin caracteres que se confunden (0/O, 1/l/I)
export const generarClave = (largo = 8) => {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digitos = "23456789";
  const todos = letras + digitos;
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint32Array(largo));
    const clave = Array.from(bytes, (b) => todos[b % todos.length]).join("");
    if (/\d/.test(clave) && /[a-zA-Z]/.test(clave)) return clave;
  }
};

// Marca en qué colección ocurrió un error, para poder explicar mejor un "permiso denegado"
export const conPaso = async (coleccion, fn) => {
  try {
    return await fn();
  } catch (err) {
    err.paso = coleccion;
    throw err;
  }
};

// Crea un jugador: perfil + contraseña cifrada. El usuario es el id del documento, así que no puede repetirse.
export const crearCuentaJugador = async ({ nombre, usuario, clave }) => {
  const user = normalizarUsuario(usuario);
  if (user.length < 3) throw Object.assign(new Error("usuario corto"), { code: "usuario-corto" });
  const error = validarClave(clave);
  if (error) throw Object.assign(new Error(error), { code: "clave-debil", mensaje: error });

  const ref = doc(db, "jugadores", user);
  if ((await conPaso("jugadores (lectura)", () => getDoc(ref))).exists()) throw Object.assign(new Error("usuario existente"), { code: "usuario-existente" });

  const { sal, hash } = await hashClave(clave);
  await conPaso("jugadores", () => setDoc(ref, { nombre, usuario: user, sal, hash, iter: ITERACIONES, debeCambiarClave: true, creado: Date.now() }));
  await conPaso("temporales", () => guardarTemporal(user, clave));
  return { uid: user, usuario: user };
};

// La contraseña temporal que entrega el administrador se guarda aparte, visible solo para él (ver reglas).
// Se borra sola cuando la persona elige la suya; la contraseña personal nunca se puede ver.
const guardarTemporal = (uid, clave) => setDoc(doc(db, "temporales", uid), { clave, creado: Date.now() });

export const mensajeErrorCuenta = (err) => {
  if (err.code === "usuario-existente") return "Ese usuario ya existe. Prueba con otro, por ejemplo agregándole un número.";
  if (err.code === "usuario-corto") return "El usuario debe tener al menos 3 caracteres (letras, números, punto o guion bajo).";
  if (err.code === "clave-debil") return err.mensaje;
  if (err.code === "permission-denied") return `Firebase no dejó escribir en «${err.paso || "la base de datos"}». Revisa que las reglas publicadas incluyan esa colección y que hayas entrado como administrador.`;
  return "No se pudo crear la cuenta.";
};

// El administrador define una contraseña temporal nueva (no puede ver la anterior)
export const resetearClave = async (uid, clave) => {
  const { sal, hash } = await hashClave(clave);
  await updateDoc(doc(db, "jugadores", uid), { sal, hash, iter: ITERACIONES, debeCambiarClave: true });
  await guardarTemporal(uid, clave);
};
