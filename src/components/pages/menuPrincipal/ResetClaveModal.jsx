import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiX, FiRefreshCw, FiKey, FiCopy, FiCheck, FiAlertTriangle } from "react-icons/fi";
import { generarClave, resetearClave, validarClave } from "./acciones";
import "./Pasanaku.css";

// El administrador define una contraseña temporal nueva. No puede ver la actual: solo reemplazarla.
const ResetClaveModal = ({ persona, onListo, onCerrar }) => {
  const [clave, setClave] = useState(generarClave());
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState("datos"); // datos | confirmar

  const revisar = (e) => {
    e.preventDefault();
    const problema = validarClave(clave);
    if (problema) return toast.error(problema);
    setPaso("confirmar");
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(clave); toast.success("Contraseña copiada"); }
    catch { toast.error("No se pudo copiar."); }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await resetearClave(persona.uid, clave);
      onListo({ nombre: persona.nombre, usuario: persona.usuario, clave });
    } catch (err) {
      console.error("resetearClave:", err);
      toast.error(`No se pudo cambiar la contraseña (${err.code || "error"}). ¿Publicaste las reglas nuevas de Firestore?`, { duration: 7000 });
      setGuardando(false);
    }
  };

  if (paso === "confirmar") {
    return (
      <div className="pk-modal-fondo pk-centrado" onClick={guardando ? undefined : onCerrar} role="presentation">
        <div className="pk-modal pk-confirmar-clave" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
          <div className="pk-confirmar-icono"><FiKey /></div>
          <h3>¿Cambiar la contraseña de {persona.nombre}?</h3>
          <p>La contraseña actual dejará de funcionar. Esta será su nueva contraseña temporal, y al entrar tendrá que crear una propia:</p>
          <div className="pk-clave-caja">
            <code>{clave}</code>
            <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={copiar}><FiCopy /> Copiar contraseña</button>
          </div>
          <small className="pk-clave-usuario">Usuario: <strong>{persona.usuario}</strong></small>
          <p className="pk-aviso-pedido"><FiAlertTriangle /> Cópiala ahora y compártela con {persona.nombre}: después no podrás volver a verla si ya la cambió.</p>
          <div className="pk-actions">
            <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setPaso("datos")} disabled={guardando}>Volver</button>
            <button type="button" className="pk-btn" onClick={guardar} disabled={guardando}><FiCheck /> {guardando ? "Guardando..." : "Sí, cambiar contraseña"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pk-modal-fondo pk-centrado" onClick={onCerrar} role="presentation">
      <form className="pk-modal pk-form" onClick={(e) => e.stopPropagation()} onSubmit={revisar} style={{ maxWidth: 460 }}>
        <div className="pk-modal-cab">
          <div>
            <h2>Generar nueva contraseña</h2>
            <p>{persona.nombre} · usuario <strong>{persona.usuario}</strong></p>
          </div>
          <button type="button" className="pk-icon" onClick={onCerrar}><FiX /></button>
        </div>
        <label>Nueva contraseña temporal
          <span className="pk-clave">
            <input type="text" value={clave} onChange={(e) => setClave(e.target.value)} minLength={8} required />
            <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setClave(generarClave())}><FiRefreshCw /> Generar</button>
          </span>
        </label>
        <small className="pkf-nota">Reemplaza la que tenía. La próxima vez que entre, la persona deberá elegir una propia.</small>
        <div className="pk-actions">
          <button type="button" className="pk-btn pk-btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="pk-btn"><FiKey /> Continuar</button>
        </div>
      </form>
    </div>
  );
};

ResetClaveModal.propTypes = {
  persona: PropTypes.shape({ uid: PropTypes.string, nombre: PropTypes.string, usuario: PropTypes.string }).isRequired,
  onListo: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default ResetClaveModal;
