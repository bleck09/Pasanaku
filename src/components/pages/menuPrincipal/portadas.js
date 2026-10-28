// Degradado de portada de cada pasanaku: siempre el mismo color para el mismo nombre
const PORTADAS = [
  ["#3F82C9", "#7FB6EC"], ["#2F9E8F", "#7ACFC0"], ["#6E8BE0", "#A9BCF2"], ["#8E74D4", "#BBA8EE"], ["#3F9BB8", "#86D0E4"],
];

export const portadaDe = (nombre = "") => {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  const [a, b] = PORTADAS[h % PORTADAS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};
