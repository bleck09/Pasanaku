import React from "react";
import PropTypes from "prop-types";

// Alcancía ilustrada con volumen (degradados, brillos y sombras) y monedas, sin fondo. Es un dibujo vectorial: pesa casi nada y se ve nítido en cualquier pantalla.
const Moneda = ({ x, y, giro = 0, escala = 1, id }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
    <ellipse cx="0" cy="9" rx="30" ry="30" fill={`url(#borde-${id})`} />
    <ellipse cx="0" cy="0" rx="30" ry="30" fill={`url(#oro-${id})`} stroke="#F6C85F" strokeWidth="2" />
    <ellipse cx="0" cy="0" rx="21" ry="21" fill="none" stroke="#C98A14" strokeOpacity="0.55" strokeWidth="2.5" />
    <text x="0" y="7" textAnchor="middle" fontSize="19" fontWeight="800" fill="#9A6500" fontFamily="Montserrat, Arial, sans-serif">Bs</text>
    <path d="M-20 -14 Q-6 -27 12 -24" stroke="#fff" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" fill="none" />
  </g>
);

const Brillo = ({ x, y, r = 10 }) => (
  <path d={`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`} fill="#fff" opacity="0.9" />
);

Moneda.propTypes = { x: PropTypes.number, y: PropTypes.number, giro: PropTypes.number, escala: PropTypes.number, id: PropTypes.string };
Brillo.propTypes = { x: PropTypes.number, y: PropTypes.number, r: PropTypes.number };

const Cerdito3D = () => (
  <svg className="lp-cerdito-svg" viewBox="0 0 440 380" role="img" aria-label="Alcancía con monedas">
    <defs>
      {["a", "b", "c"].map((id) => (
        <React.Fragment key={id}>
          <linearGradient id={`oro-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE9A0" />
            <stop offset="0.55" stopColor="#F2B83E" />
            <stop offset="1" stopColor="#D8922A" />
          </linearGradient>
          <linearGradient id={`borde-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0A03F" />
            <stop offset="1" stopColor="#B87A14" />
          </linearGradient>
        </React.Fragment>
      ))}
      <radialGradient id="cuerpo" cx="0.34" cy="0.28" r="0.85">
        <stop offset="0" stopColor="#FFC9DC" />
        <stop offset="0.45" stopColor="#FF8FB6" />
        <stop offset="1" stopColor="#E0508A" />
      </radialGradient>
      <radialGradient id="hocico" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#FFD3E2" />
        <stop offset="1" stopColor="#F27AA5" />
      </radialGradient>
      <linearGradient id="oreja" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF9EC0" />
        <stop offset="1" stopColor="#D9487F" />
      </linearGradient>
      <linearGradient id="pata" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F2709F" />
        <stop offset="1" stopColor="#C23A74" />
      </linearGradient>
      <filter id="desenfoque" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9" /></filter>
      <filter id="suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
    </defs>

    {/* sombra en el piso */}
    <ellipse cx="215" cy="346" rx="150" ry="17" fill="#1B3A6B" opacity="0.28" filter="url(#desenfoque)" />

    <g transform="rotate(-6 215 200)">
      {/* patas traseras (detrás del cuerpo) */}
      <rect x="258" y="252" width="52" height="82" rx="24" fill="url(#pata)" />
      <rect x="112" y="250" width="52" height="84" rx="24" fill="url(#pata)" />

      {/* cola */}
      <path d="M72 196 C38 188 34 150 62 150 C80 150 78 170 64 170" stroke="#E0508A" strokeWidth="11" strokeLinecap="round" fill="none" />

      {/* cuerpo */}
      <ellipse cx="206" cy="204" rx="146" ry="112" fill="url(#cuerpo)" />
      {/* sombra inferior para dar volumen */}
      <path d="M72 230 Q206 340 340 232 Q330 300 206 316 Q86 300 72 230 Z" fill="#B02F68" opacity="0.28" filter="url(#suave)" />

      {/* patas delanteras */}
      <rect x="140" y="262" width="56" height="78" rx="26" fill="url(#pata)" />
      <rect x="236" y="264" width="56" height="76" rx="26" fill="url(#pata)" />
      <ellipse cx="168" cy="338" rx="26" ry="7" fill="#9E2A5F" opacity="0.5" />
      <ellipse cx="264" cy="338" rx="26" ry="7" fill="#9E2A5F" opacity="0.5" />

      {/* orejas */}
      <path d="M118 104 C112 66 146 48 176 76 C166 92 144 104 118 104 Z" fill="url(#oreja)" />
      <path d="M134 98 C132 78 150 68 164 80 C158 88 148 96 134 98 Z" fill="#FFB5CF" opacity="0.85" />
      <path d="M232 76 C258 46 296 62 288 104 C264 106 244 94 232 76 Z" fill="url(#oreja)" />
      <path d="M246 80 C260 64 280 72 278 94 C266 94 254 88 246 80 Z" fill="#FFB5CF" opacity="0.85" />

      {/* ranura de la alcancía */}
      <rect x="168" y="96" width="92" height="15" rx="7.5" fill="#B02F68" />
      <rect x="172" y="99" width="84" height="7" rx="3.5" fill="#6E1A41" />

      {/* hocico */}
      <ellipse cx="342" cy="214" rx="44" ry="37" fill="url(#hocico)" />
      <ellipse cx="342" cy="205" rx="30" ry="14" fill="#fff" opacity="0.28" filter="url(#suave)" />
      <ellipse cx="329" cy="214" rx="6.5" ry="10" fill="#A02A5E" />
      <ellipse cx="355" cy="214" rx="6.5" ry="10" fill="#A02A5E" />

      {/* ojo y mejilla */}
      <circle cx="288" cy="160" r="11" fill="#2E1A3B" />
      <circle cx="291" cy="156" r="3.6" fill="#fff" />
      <ellipse cx="286" cy="196" rx="20" ry="11" fill="#FF6F9F" opacity="0.5" filter="url(#suave)" />
      <path d="M268 140 Q286 128 306 140" stroke="#B02F68" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* brillo del cuerpo */}
      <ellipse cx="150" cy="140" rx="62" ry="30" transform="rotate(-24 150 140)" fill="#fff" opacity="0.4" filter="url(#suave)" />
      <ellipse cx="120" cy="190" rx="10" ry="30" transform="rotate(14 120 190)" fill="#fff" opacity="0.22" filter="url(#suave)" />

      {/* moneda entrando por la ranura */}
      <Moneda x={214} y={66} giro={-18} escala={0.95} id="a" />
    </g>

    {/* monedas sueltas */}
    <Moneda x={372} y={308} giro={-8} escala={0.9} id="b" />
    <Moneda x={330} y={326} giro={10} escala={0.72} id="c" />
    <Moneda x={66} y={296} giro={14} escala={0.74} id="b" />

    <Brillo x={392} y={170} r={11} />
    <Brillo x={44} y={120} r={9} />
    <Brillo x={405} y={236} r={6} />
  </svg>
);

export default Cerdito3D;
