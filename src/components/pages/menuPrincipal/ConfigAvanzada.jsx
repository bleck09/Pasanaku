import React, { useState } from "react";
import PropTypes from "prop-types";
import { FiSettings, FiChevronDown, FiPlus, FiX, FiLock } from "react-icons/fi";
import Combo from "./Combo";
import "./Pasanaku.css";

// Configuración avanzada del sorteo: lugares que un participante pidió (ej. "quiero ser el primero" o "el último").
// Esos lugares quedan fijos y se muestran como "Pedido" en el resultado; la ruleta sortea solo los lugares restantes.
const ConfigAvanzada = ({ personas, fijas, onCambio, total, bloqueado }) => {
  const [abierto, setAbierto] = useState(false);
  const [persona, setPersona] = useState("");
  const [lugar, setLugar] = useState("");

  const libresPersonas = personas.filter((p) => !fijas.some((f) => f.id === p.id));
  const lugaresLibres = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !fijas.some((f) => f.pos === n));
  const nombreDe = (id) => personas.find((p) => p.id === id)?.nombre || "—";

  const fijar = () => {
    // el <select> devuelve texto; se busca a la persona para conservar su id original (puede ser número)
    const elegida = personas.find((p) => String(p.id) === persona);
    if (!elegida || !lugar) return;
    onCambio([...fijas, { id: elegida.id, pos: Number(lugar) }].sort((a, b) => a.pos - b.pos));
    setPersona("");
    setLugar("");
  };

  return (
    <div className="pk-avanzada">
      <button type="button" className="pk-avanzada-cab" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <FiSettings /> <span>Configuración avanzada</span>
        {fijas.length > 0 && <b className="pk-paso-cuenta">{fijas.length}</b>}
        <FiChevronDown className={abierto ? "girado" : ""} />
      </button>

      {abierto && (
        <div className="pk-avanzada-cuerpo">
          <p className="pkf-nota">
            Si alguien pidió un lugar (el primero, el último...), fíjalo aquí. Cuando llegue ese lugar la ruleta <strong>gira igual pero se detiene en esa persona</strong>, y se avisa como <strong>«Pedido»</strong> al girar y en el resultado, para que todos lo sepan. Los demás lugares sí se sortean al azar.
          </p>

          {fijas.length > 0 && (
            <ul className="pk-avanzada-lista">
              {fijas.map((f) => (
                <li key={f.id}>
                  <span className="pk-turno">{f.pos}</span>
                  <strong>{nombreDe(f.id)}</strong>
                  <span className="pk-chip pk-chip-rev" style={{ cursor: "default" }}><FiLock /> Pedido</span>
                  <button type="button" className="pk-icon" title="Quitar" onClick={() => onCambio(fijas.filter((x) => x.id !== f.id))} disabled={bloqueado}><FiX /></button>
                </li>
              ))}
            </ul>
          )}

          {bloqueado ? (
            <small className="pkf-nota">Para cambiar los lugares pedidos, empieza el sorteo de nuevo.</small>
          ) : libresPersonas.length > 1 && lugaresLibres.length > 1 ? (
            <div className="pk-avanzada-form">
              <Combo valor={persona} onChange={setPersona} placeholder="¿Quién?" etiqueta="Persona" opciones={libresPersonas.map((p) => ({ valor: p.id, texto: p.nombre }))} />
              <Combo valor={lugar} onChange={setLugar} placeholder="¿Qué lugar?" etiqueta="Lugar" opciones={lugaresLibres.map((n) => ({ valor: n, texto: `Lugar ${n}${n === 1 ? " (primero)" : n === total ? " (último)" : ""}` }))} />
              <button type="button" className="pk-btn" onClick={fijar} disabled={!persona || !lugar}><FiPlus /> Fijar</button>
            </div>
          ) : (
            <small className="pkf-nota">Debe quedar al menos 2 personas para sortear.</small>
          )}
        </div>
      )}
    </div>
  );
};

ConfigAvanzada.propTypes = {
  personas: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), nombre: PropTypes.string })).isRequired,
  fijas: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), pos: PropTypes.number })).isRequired,
  onCambio: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired,
  bloqueado: PropTypes.bool,
};

export default ConfigAvanzada;
