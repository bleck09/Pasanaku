import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiArrowUp, FiArrowDown, FiMenu, FiSave } from "react-icons/fi";
import Avatar from "./Avatar";
import "./Pasanaku.css";

// Orden de cobro a mano, para quienes sortean de otra forma (papelitos, un juego...): se sube, baja o arrastra a cada persona
const OrdenManual = ({ lista, fotos, grupoId, onListo }) => {
  const [orden, setOrden] = useState(lista);
  const [arrastrado, setArrastrado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const mover = (desde, hasta) => {
    if (hasta < 0 || hasta >= orden.length || desde === hasta) return;
    const copia = [...orden];
    const [item] = copia.splice(desde, 1);
    copia.splice(hasta, 0, item);
    setOrden(copia);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const lote = writeBatch(db);
      orden.forEach((p, i) => lote.update(doc(db, "participantes", p.id), { turno: i + 1 }));
      if (grupoId) lote.update(doc(db, "pasanakus", grupoId), { ordenListo: true });
      await lote.commit();
      toast.success("Orden de cobro guardado");
      onListo();
    } catch (err) {
      console.error("Guardar orden manual:", err);
      toast.error(`No se pudo guardar el orden (${err.code || "error"}).`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pk-orden-manual">
      <p className="pkf-nota">Ordena a las personas como salió en su sorteo. En computadora puedes arrastrarlas; en el celular usa las flechas.</p>
      <ol className="pk-manual-lista">
        {orden.map((p, i) => (
          <li
            key={p.id}
            className={arrastrado === i ? "arrastrando" : ""}
            draggable
            onDragStart={() => setArrastrado(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (arrastrado !== null) mover(arrastrado, i); setArrastrado(null); }}
            onDragEnd={() => setArrastrado(null)}
          >
            <FiMenu className="pk-manual-asa" aria-hidden="true" />
            <span className="pk-manual-num">#{i + 1}</span>
            <Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={34} />
            <strong>{p.nombre}</strong>
            <span className="pk-manual-flechas">
              <button type="button" className="pk-icon" title="Subir" aria-label={`Subir a ${p.nombre}`} onClick={() => mover(i, i - 1)} disabled={i === 0}><FiArrowUp /></button>
              <button type="button" className="pk-icon" title="Bajar" aria-label={`Bajar a ${p.nombre}`} onClick={() => mover(i, i + 1)} disabled={i === orden.length - 1}><FiArrowDown /></button>
            </span>
          </li>
        ))}
      </ol>
      <div className="pk-actions">
        <button type="button" className="pk-btn" onClick={guardar} disabled={guardando}><FiSave /> {guardando ? "Guardando..." : "Guardar este orden"}</button>
      </div>
    </div>
  );
};

OrdenManual.propTypes = {
  lista: PropTypes.array.isRequired,
  fotos: PropTypes.instanceOf(Map).isRequired,
  grupoId: PropTypes.string,
  onListo: PropTypes.func.isRequired,
};

export default OrdenManual;
