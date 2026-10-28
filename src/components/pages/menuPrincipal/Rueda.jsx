import React from "react";
import PropTypes from "prop-types";
import { FiRotateCw } from "react-icons/fi";
import { DURACION, EASING, GRADIENTES } from "./ruedaUtils";
import "./Pasanaku.css";

const RADIO = 100;
const punto = (r, grados) => [r * Math.sin((grados * Math.PI) / 180), -r * Math.cos((grados * Math.PI) / 180)];

// Tamaño de letra y largo máximo para que el nombre quepa dentro de su porción (sin cruzar el centro ni invadir las vecinas)
const medidas = (cantidad) => {
  const ancho = (2 * Math.PI * 62 * (1 / cantidad)); // ancho de la porción a mitad del radio del texto
  const tam = Math.max(4.5, Math.min(11, ancho * 0.55));
  const maxCaracteres = Math.max(3, Math.floor(58 / (tam * 0.6)));
  return { tam, maxCaracteres };
};

// Rueda de la ruleta: una porción de color por nombre y una flecha arriba que marca quién sale
const Rueda = ({ opciones, giro, girando, onFin, onGirar, desactivado = false }) => {
  const a = 360 / opciones.length;
  const { tam, maxCaracteres } = medidas(opciones.length);

  return (
    <div className="pk-ruleta-caja">
      <svg className="pk-ruleta-puntero" viewBox="0 0 40 54" aria-hidden="true">
        <defs>
          <linearGradient id="pk-puntero" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A7A" /><stop offset="1" stopColor="#E0453F" /></linearGradient>
        </defs>
        <path d="M20 52 C20 52 4 32 4 19 A16 16 0 0 1 36 19 C36 32 20 52 20 52 Z" fill="url(#pk-puntero)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="20" cy="19" r="6.5" fill="#fff" opacity="0.95" />
        <ellipse cx="14" cy="11" rx="4" ry="2.4" fill="#fff" opacity="0.5" transform="rotate(-30 14 11)" />
      </svg>
      <div className="pk-ruleta-rueda">
      <svg viewBox="-110 -110 220 220" className="pk-ruleta-svg">
        <defs>
          <radialGradient id="pk-brillo" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#0A2454" stopOpacity="0.2" />
          </radialGradient>
          {GRADIENTES.map(([claro, intenso], i) => (
            <linearGradient key={i} id={`pk-g-${i}`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor={claro} />
              <stop offset="1" stopColor={intenso} />
            </linearGradient>
          ))}
          <linearGradient id="pk-g-gris" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stopColor="#C9D5E4" /><stop offset="1" stopColor="#9AABC0" /></linearGradient>
          <linearGradient id="pk-aro-ext" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7FB6EC" /><stop offset="1" stopColor="#2F6DB5" /></linearGradient>
          <linearGradient id="pk-aro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D5E3F6" /></linearGradient>
          <radialGradient id="pk-hub" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#8FC0F4" /><stop offset="1" stopColor="#2F6DB5" /></radialGradient>
          <linearGradient id="pk-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <clipPath id="pk-clip"><circle r="100" /></clipPath>
          <filter id="pk-luz" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>

        {/* aro exterior con luces */}
        <circle r="109" fill="url(#pk-aro-ext)" />
        <circle r="105.5" fill="url(#pk-aro)" />
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = punto(103, i * 15);
          const color = i % 2 ? "#FFC857" : "#6FA8F0";
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2.2" fill={color} opacity="0.55" filter="url(#pk-luz)" />
              <circle cx={x} cy={y} r="1.25" fill={color} />
            </g>
          );
        })}

        <g
          style={{ transform: `rotate(${giro}deg)`, transition: girando ? `transform ${DURACION}ms cubic-bezier(${EASING.join(", ")})` : "none" }}
          onTransitionEnd={onFin}
        >
          {opciones.length === 1 ? (
            <g>
              <circle r={RADIO} fill="url(#pk-g-0)" stroke="#fff" strokeWidth="1" />
              <text x="0" y="-52" dy="0.35em" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" stroke="rgba(20, 50, 90, 0.35)" strokeWidth="0.5" paintOrder="stroke">
                {opciones[0].nombre.length > 16 ? `${opciones[0].nombre.slice(0, 15)}…` : opciones[0].nombre}
              </text>
            </g>
          ) : opciones.map((o, i) => {
            const [x1, y1] = punto(RADIO, i * a);
            const [x2, y2] = punto(RADIO, (i + 1) * a);
            const corto = o.nombre.length > maxCaracteres ? `${o.nombre.slice(0, maxCaracteres - 1)}…` : o.nombre;
            const nombre = o.reservado ? `${corto} ` : corto;
            return (
              <g key={o.id}>
                <path d={`M0 0 L${x1} ${y1} A${RADIO} ${RADIO} 0 0 1 ${x2} ${y2} Z`} fill={o.reservado ? "url(#pk-g-gris)" : `url(#pk-g-${i % GRADIENTES.length})`} stroke="#fff" strokeWidth="0.9" strokeOpacity="0.9" />
                <g transform={`rotate(${(i + 0.5) * a - 90})`}>
                  <text
                    x="88" y="0" dy="0.35em" textAnchor="end" fill="#fff" fontSize={tam} fontWeight="800" letterSpacing="0.3"
                    stroke="rgba(10, 36, 84, 0.45)" strokeWidth="0.6" paintOrder="stroke"
                  >
                    {nombre}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        <circle r={RADIO} fill="url(#pk-brillo)" pointerEvents="none" />
        <ellipse cx="-30" cy="-58" rx="64" ry="34" transform="rotate(-24 -30 -58)" fill="url(#pk-gloss)" clipPath="url(#pk-clip)" pointerEvents="none" />
        <circle r="19" fill="#fff" opacity="0.95" />
        <circle r="19" fill="none" stroke="rgba(47,109,181,0.18)" strokeWidth="1.5" />
        <circle r="13" fill="url(#pk-hub)" />
        <ellipse cx="-4" cy="-6" rx="6" ry="3.4" fill="#fff" opacity="0.5" transform="rotate(-30 -4 -6)" />
      </svg>
      {onGirar && (
        <button type="button" className={`pk-ruleta-hub ${girando ? "girando" : ""}`} onClick={onGirar} disabled={girando || desactivado} aria-label={girando ? "Girando" : "Girar la ruleta"}>
          <FiRotateCw />
          <span>{girando ? "..." : "GIRAR"}</span>
        </button>
      )}
      </div>
    </div>
  );
};

Rueda.propTypes = {
  opciones: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), nombre: PropTypes.string, reservado: PropTypes.bool })).isRequired,
  giro: PropTypes.number.isRequired, girando: PropTypes.bool.isRequired, onFin: PropTypes.func.isRequired,
  onGirar: PropTypes.func, desactivado: PropTypes.bool,
};

export default Rueda;
