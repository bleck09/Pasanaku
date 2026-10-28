// Contraseñas de los jugadores: nunca se guardan en texto. Se guarda solo un hash PBKDF2-SHA256 con sal
// propia por persona, calculado en el navegador (Web Crypto). Nadie puede ver una contraseña; solo reemplazarla.
export const ITERACIONES = 310000; // las cuentas ya creadas conservan sus propias iteraciones

const aHex = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
const deHex = (hex) => new Uint8Array((hex.match(/.{2}/g) || []).map((b) => parseInt(b, 16)));

// Devuelve { sal, hash }. Sin `salHex` genera una sal nueva.
export const hashClave = async (clave, salHex, iter = ITERACIONES) => {
  const sal = salHex ? deHex(salHex) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iter }, material, 256);
  return { sal: aHex(sal), hash: aHex(bits) };
};

export const verificarClave = async (clave, perfil) => {
  const { hash } = await hashClave(clave, perfil.sal, perfil.iter || ITERACIONES);
  if (hash.length !== perfil.hash?.length) return false;
  let diferencia = 0; // comparación en tiempo constante
  for (let i = 0; i < hash.length; i++) diferencia |= hash.charCodeAt(i) ^ perfil.hash.charCodeAt(i);
  return diferencia === 0;
};
