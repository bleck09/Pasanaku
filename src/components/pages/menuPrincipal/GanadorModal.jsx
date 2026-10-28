import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FiArrowRight } from "react-icons/fi";
import Avatar from "./Avatar";
import "./Pasanaku.css";

const COLORES = ["#4A8FD6", "#2E9A6B", "#E0A03F", "#CE7FAA", "#8E74D4", "#3F9BB8"];

// Anuncio a pantalla completa de quién salió, con confeti
const GanadorModal = ({ nombre, foto, detalle, onCerrar }) => {
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape" || e.key === "Enter") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const confeti = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    izquierda: Math.random() * 100,
    demora: Math.random() * 0.6,
    duracion: 2.2 + Math.random() * 1.8,
    color: COLORES[i % COLORES.length],
    giro: Math.random() * 360,
    ancho: 6 + Math.random() * 6,
  })), []);

  return (
    <div className="pk-ganador-fondo" onClick={onCerrar} role="presentation">
      <div className="pk-confeti" aria-hidden="true">
        {confeti.map((c, i) => (
          <span key={i} style={{ left: `${c.izquierda}%`, animationDelay: `${c.demora}s`, animationDuration: `${c.duracion}s`, background: c.color, width: c.ancho, height: c.ancho * 1.6, transform: `rotate(${c.giro}deg)` }} />
        ))}
      </div>
      <div className="pk-ganador" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <span className="pk-ganador-etiqueta">{detalle || "¡Salió!"}</span>
        <div className="pk-ganador-avatar"><Avatar nombre={nombre} foto={foto} tam={112} /></div>
        <h2>{nombre}</h2>
        <button type="button" className="pk-btn pk-ruleta-boton" onClick={onCerrar} autoFocus>Continuar <FiArrowRight /></button>
      </div>
    </div>
  );
};

GanadorModal.propTypes = { nombre: PropTypes.string.isRequired, foto: PropTypes.string, detalle: PropTypes.string, onCerrar: PropTypes.func.isRequired };

export default GanadorModal;
