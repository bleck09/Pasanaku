import React from "react";
import PropTypes from "prop-types";
import "./Pasanaku.css";

// Pares de azules/verdes/lilas suaves para el avatar por defecto: cada persona siempre recibe el mismo color
const PALETAS = [
  ["#6FAAE3", "#4A8FD6"], ["#7CC4B0", "#3FA58C"], ["#9DB4F0", "#6E8BE0"], ["#E3A9C8", "#CE7FAA"],
  ["#F0C27A", "#E0A03F"], ["#A6D18B", "#74B25A"], ["#B7A3E6", "#8E74D4"], ["#7FC7DC", "#45A8C6"],
];

const iniciales = (nombre = "") => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
};

const paletaDe = (nombre = "") => {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return PALETAS[h % PALETAS.length];
};

// Foto de perfil; si la persona no puso una, un círculo de color con sus iniciales
const Avatar = ({ nombre, foto, tam = 36, className = "" }) => {
  const [a, b] = paletaDe(nombre);
  return foto ? (
    <img className={`pk-avatar ${className}`} src={foto} alt={nombre} style={{ width: tam, height: tam }} />
  ) : (
    <span className={`pk-avatar pk-avatar-letras ${className}`} style={{ width: tam, height: tam, fontSize: tam * 0.4, background: `linear-gradient(135deg, ${a}, ${b})` }} aria-label={nombre}>
      {iniciales(nombre)}
    </span>
  );
};

Avatar.propTypes = { nombre: PropTypes.string, foto: PropTypes.string, tam: PropTypes.number, className: PropTypes.string };

export default Avatar;
