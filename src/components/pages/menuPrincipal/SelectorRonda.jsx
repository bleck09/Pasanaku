import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiCalendar } from "react-icons/fi";
import { useFuera } from "./useFuera";
import "./Pasanaku.css";

// Selector de ronda pensado para muchas rondas (semanales, 50+): flechas anterior/siguiente y una cuadrícula numerada
const SelectorRonda = ({ valor, total, actual, onChange, fechaDe }) => {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const cerrar = useCallback(() => setAbierto(false), []);
  useFuera(caja, abierto, cerrar);

  const etiqueta = valor === actual ? "actual" : valor > actual ? "próxima" : "anterior";
  const elegir = (r) => { onChange(r); setAbierto(false); };

  return (
    <div className="pk-selronda" ref={caja}>
      <button type="button" className="pk-icon" title="Ronda anterior" onClick={() => onChange(valor - 1)} disabled={valor <= 1}><FiChevronLeft /></button>
      <button type="button" className="pk-selronda-actual" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <FiCalendar />
        <span><strong>Ronda {valor}</strong> de {total}<small>{fechaDe(valor)} · {etiqueta}</small></span>
        <FiChevronDown className={abierto ? "girado" : ""} />
      </button>
      <button type="button" className="pk-icon" title="Ronda siguiente" onClick={() => onChange(valor + 1)} disabled={valor >= total}><FiChevronRight /></button>

      {abierto && (
        <div className="pk-selronda-panel">
          <div className="pk-selronda-grid">
            {Array.from({ length: total }, (_, i) => i + 1).map((r) => (
              <button key={r} type="button" title={fechaDe(r)} className={`${r === valor ? "sel" : ""} ${r === actual ? "actual" : ""}`} onClick={() => elegir(r)}>{r}</button>
            ))}
          </div>
          {valor !== actual && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => elegir(actual)}>Ir a la ronda actual ({actual})</button>}
        </div>
      )}
    </div>
  );
};

SelectorRonda.propTypes = {
  valor: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  actual: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  fechaDe: PropTypes.func.isRequired,
};

export default SelectorRonda;
