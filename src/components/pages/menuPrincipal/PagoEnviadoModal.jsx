import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FiArrowRight } from "react-icons/fi";
import { leerSonido, sonidoPagoEnviado } from "./sonido";
import { money } from "./pasanakuUtils";
import "./Pasanaku.css";

const COLORES = ["#2E9A6B", "#4A8FD6", "#E0A03F", "#8E74D4", "#3F9BB8", "#CE7FAA"];

// Aviso a pantalla completa de que el pago se envió: check animado, confeti y un sonido corto
const PagoEnviadoModal = ({ monto, ronda, titulo = "¡Pago enviado!", texto, onCerrar }) => {
  useEffect(() => {
    if (leerSonido()) sonidoPagoEnviado();
  }, []);

  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape" || e.key === "Enter") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const confeti = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    izquierda: Math.random() * 100,
    demora: Math.random() * 0.5,
    duracion: 2 + Math.random() * 1.6,
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
      <div className="pk-ganador pk-enviado" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <svg className="pk-check-anim" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="pk-check-circulo" cx="26" cy="26" r="24" fill="none" />
          <path className="pk-check-marca" fill="none" d="M14 27l8 8 16-17" />
        </svg>
        <h2>{titulo}</h2>
        <p className="pk-enviado-monto">{money(monto)}</p>
        <p className="pk-enviado-texto">{texto || <>Tu pago de la ronda {ronda} quedó <strong>en revisión</strong>. Cuando el administrador lo confirme se marcará como pagado.</>}</p>
        <button type="button" className="pk-btn pk-ruleta-boton" onClick={onCerrar} autoFocus>Listo <FiArrowRight /></button>
      </div>
    </div>
  );
};

PagoEnviadoModal.propTypes = { monto: PropTypes.number.isRequired, ronda: PropTypes.number, titulo: PropTypes.string, texto: PropTypes.string, onCerrar: PropTypes.func.isRequired };

export default PagoEnviadoModal;
