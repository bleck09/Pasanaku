import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Avatar from "./Avatar";
import "./Pasanaku.css";

// Cabecera de un pasanaku: portada con degradado, integrantes con foto, datos clave y pestañas de navegación
const Portada = ({ titulo, estado, estadoClase, subtitulo, miembros, fotos, datos, pestanas, activa, onTab, onVolver, volverTexto }) => {
  const nav = useRef(null);
  const [borde, setBorde] = useState({ izq: false, der: false }); // si hay más pestañas ocultas a cada lado

  const medir = useCallback(() => {
    const el = nav.current;
    if (!el) return;
    setBorde({ izq: el.scrollLeft > 16, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 16 });
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir, pestanas.length]);

  // la pestaña activa siempre queda a la vista
  useEffect(() => {
    nav.current?.querySelector(".pk-tab.activa")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activa]);

  const deslizar = (dir) => nav.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  const visibles = miembros.slice(0, 7);
  const extra = miembros.length - visibles.length;

  return (
    <div className="pk-portada">
      <div className="pk-portada-banner">
        <span className="pk-portada-circ c1" /><span className="pk-portada-circ c2" /><span className="pk-portada-circ c3" />
        {onVolver && <button type="button" className="pk-portada-volver" onClick={onVolver}><FiArrowLeft /> {volverTexto}</button>}

        <div className="pk-portada-fila">
          <div className="pk-portada-info">
            <span className={`pk-portada-estado ${estadoClase}`}>{estado}</span>
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
            {miembros.length > 0 && (
              <div className="pk-portada-pila" title={miembros.map((m) => m.nombre).join(", ")}>
                {visibles.map((m) => <Avatar key={m.id} nombre={m.nombre} foto={fotos.get(m.uid)} tam={38} className="pk-pila-av" />)}
                {extra > 0 && <span className="pk-pila-mas">+{extra}</span>}
                <small>{miembros.length} participante{miembros.length === 1 ? "" : "s"}</small>
              </div>
            )}
          </div>

          <div className="pk-portada-datos">
            {datos.map((d) => <div key={d.etiqueta}><small>{d.etiqueta}</small><strong>{d.valor}</strong></div>)}
          </div>
        </div>
      </div>

      <div className="pk-tabs-caja">
        {borde.izq && <button type="button" className="pk-tabs-flecha izq" aria-label="Ver pestañas anteriores" onClick={() => deslizar(-1)}><FiChevronLeft /></button>}
        <nav className="pk-portada-tabs" aria-label="Secciones del pasanaku" ref={nav} onScroll={medir}>
          {pestanas.map((t) => (
            <button key={t.id} type="button" className={`pk-tab ${activa === t.id ? "activa" : ""}`} onClick={() => onTab(t.id)}>
              {t.icono} {t.texto}
            </button>
          ))}
        </nav>
        {borde.der && <button type="button" className="pk-tabs-flecha der" aria-label="Ver más pestañas" onClick={() => deslizar(1)}><FiChevronRight /></button>}
      </div>
    </div>
  );
};

Portada.propTypes = {
  titulo: PropTypes.string.isRequired, estado: PropTypes.string, estadoClase: PropTypes.string, subtitulo: PropTypes.string,
  miembros: PropTypes.array.isRequired, fotos: PropTypes.instanceOf(Map).isRequired,
  datos: PropTypes.arrayOf(PropTypes.shape({ etiqueta: PropTypes.string, valor: PropTypes.node })).isRequired,
  pestanas: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, texto: PropTypes.string, icono: PropTypes.node })).isRequired,
  activa: PropTypes.string.isRequired, onTab: PropTypes.func.isRequired, onVolver: PropTypes.func, volverTexto: PropTypes.string,
};

export default Portada;
