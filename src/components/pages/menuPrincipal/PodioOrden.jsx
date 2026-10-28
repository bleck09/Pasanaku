import React from "react";
import PropTypes from "prop-types";
import { FiAward } from "react-icons/fi";
import Avatar from "./Avatar";
import "./Pasanaku.css";

// Lista de posiciones estilo ranking: número grande, foto, nombre y medalla para los 3 primeros
const PodioOrden = ({ items }) => (
  <ol className="pk-podio">
    {items.map((it, i) => (
      <li key={i} className={`pk-podio-fila ${i < 3 && !it.pendiente ? `top${i + 1}` : ""} ${it.pendiente ? "pendiente" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
        <span className="pk-podio-num">{i + 1}</span>
        {it.pendiente ? <span className="pk-sorteo-hueco" /> : <Avatar nombre={it.nombre} foto={it.foto} tam={40} />}
        <strong className="pk-podio-nombre">{it.pendiente ? "Por sortear" : it.nombre}</strong>
        {it.fijo}
        {i < 3 && !it.pendiente && <FiAward className="pk-podio-medalla" />}
      </li>
    ))}
  </ol>
);

PodioOrden.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ nombre: PropTypes.string, foto: PropTypes.string, fijo: PropTypes.bool, pendiente: PropTypes.bool })).isRequired,
};

export default PodioOrden;
