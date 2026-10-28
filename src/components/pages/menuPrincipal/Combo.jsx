import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiChevronDown, FiSearch, FiCheck } from "react-icons/fi";
import { useFuera } from "./useFuera";
import "./Pasanaku.css";

// Lista desplegable con buscador y altura limitada: sirve igual con 5 que con 100 opciones
const Combo = ({ valor, opciones, onChange, placeholder, etiqueta }) => {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const caja = useRef(null);
  const cerrar = useCallback(() => { setAbierto(false); setQ(""); }, []);
  useFuera(caja, abierto, cerrar);

  const elegida = opciones.find((o) => String(o.valor) === String(valor));
  const filtradas = opciones.filter((o) => o.texto.toLowerCase().includes(q.trim().toLowerCase()));
  const elegir = (o) => { onChange(String(o.valor)); cerrar(); };

  return (
    <div className="pk-combo" ref={caja}>
      <button type="button" className={`pk-combo-boton ${elegida ? "" : "vacio"}`} onClick={() => setAbierto(!abierto)} aria-haspopup="listbox" aria-expanded={abierto} aria-label={etiqueta}>
        <span>{elegida ? elegida.texto : placeholder}</span>
        <FiChevronDown className={abierto ? "girado" : ""} />
      </button>
      {abierto && (
        <div className="pk-combo-panel">
          {opciones.length > 6 && (
            <label className="pk-combo-buscar">
              <FiSearch />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." onKeyDown={(e) => { if (e.key === "Enter" && filtradas[0]) { e.preventDefault(); elegir(filtradas[0]); } }} />
            </label>
          )}
          <ul role="listbox">
            {filtradas.length === 0 ? <li className="pk-combo-vacio">Sin resultados</li> : filtradas.map((o) => (
              <li key={o.valor}>
                <button type="button" role="option" aria-selected={String(o.valor) === String(valor)} onClick={() => elegir(o)}>
                  {o.texto}{String(o.valor) === String(valor) && <FiCheck />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

Combo.propTypes = {
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  opciones: PropTypes.arrayOf(PropTypes.shape({ valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, texto: PropTypes.string.isRequired })).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  etiqueta: PropTypes.string,
};

export default Combo;
