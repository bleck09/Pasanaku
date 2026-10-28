import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiSearch, FiChevronDown, FiLayers } from "react-icons/fi";
import { estadoGrupo, money } from "./pasanakuUtils";

const MAX_RESULTADOS = 30;

// Selector de pasanaku con búsqueda: sirve igual con 5 que con miles (en vez de una lista desplegable larguísima)
const BuscadorGrupo = ({ grupos, valor, onChange, permitirTodos }) => {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const caja = useRef(null);
  const entrada = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    entrada.current?.focus();
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);

  // Primero los que están en curso, luego los que se arman, al final los terminados
  const orden = { "En curso": 0, "Armando": 1, "Finalizado": 2 };
  const resultados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return [...grupos]
      .filter((g) => !texto || (g.nombre || "").toLowerCase().includes(texto))
      .sort((a, b) => (orden[estadoGrupo(a)] - orden[estadoGrupo(b)]) || (a.nombre || "").localeCompare(b.nombre || ""));
  }, [grupos, q]);

  const elegir = (g) => { onChange(g); setAbierto(false); setQ(""); };

  return (
    <div className="pk-buscador" ref={caja}>
      <button type="button" className="pk-buscador-boton" onClick={() => setAbierto(!abierto)}>
        <FiLayers />
        <span>{valor ? valor.nombre : "Todos los pasanakus"}</span>
        <FiChevronDown />
      </button>

      {abierto && (
        <div className="pk-buscador-panel">
          <label className="pk-buscador-input">
            <FiSearch />
            <input
              ref={entrada}
              placeholder={`Buscar entre ${grupos.length} pasanaku${grupos.length === 1 ? "" : "s"}...`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && resultados[0]) { e.preventDefault(); elegir(resultados[0]); } }}
            />
          </label>
          <ul>
            {permitirTodos && !q && (
              <li><button type="button" className={!valor ? "activa" : ""} onClick={() => elegir(null)}><strong>Todos los pasanakus</strong></button></li>
            )}
            {resultados.slice(0, MAX_RESULTADOS).map((g) => (
              <li key={g.id}>
                <button type="button" className={valor?.id === g.id ? "activa" : ""} onClick={() => elegir(g)}>
                  <strong>{g.nombre}</strong>
                  <small>{estadoGrupo(g)} · cuota {money(g.cuota)}{g.cupos ? ` · ${g.cupos} personas` : ""}</small>
                </button>
              </li>
            ))}
            {resultados.length === 0 && <li className="pk-buscador-vacio">Ningún pasanaku coincide.</li>}
            {resultados.length > MAX_RESULTADOS && <li className="pk-buscador-vacio">Hay {resultados.length - MAX_RESULTADOS} más: sigue escribiendo para acotar.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

BuscadorGrupo.propTypes = {
  grupos: PropTypes.array.isRequired,
  valor: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  permitirTodos: PropTypes.bool,
};

export default BuscadorGrupo;
