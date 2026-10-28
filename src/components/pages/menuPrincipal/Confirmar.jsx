import React, { useEffect, useState } from "react";
import { FiAlertTriangle, FiHelpCircle } from "react-icons/fi";
import "./Pasanaku.css";

// Reemplaza a window.confirm con un modal propio.
// Uso: if (!(await confirmar({ titulo, mensaje, peligro }))) return;  (y montar <ConfirmHost /> una vez)
// El abridor vive en globalThis para que siga funcionando aunque el módulo se recargue en caliente durante el desarrollo
const CLAVE_HOST = "__pkConfirmarHost";

export const confirmar = (opciones) =>
  new Promise((resolver) => {
    const abrir = globalThis[CLAVE_HOST];
    if (!abrir) return resolver(window.confirm(opciones.mensaje)); // sin host montado, no bloquea el flujo
    abrir({ ...opciones, resolver });
  });

export const ConfirmHost = () => {
  const [dialogo, setDialogo] = useState(null);

  useEffect(() => {
    globalThis[CLAVE_HOST] = setDialogo;
    return () => { if (globalThis[CLAVE_HOST] === setDialogo) globalThis[CLAVE_HOST] = null; };
  }, []);

  const cerrar = (valor) => {
    dialogo?.resolver(valor);
    setDialogo(null);
  };

  useEffect(() => {
    if (!dialogo) return undefined;
    const alTeclear = (e) => { if (e.key === "Escape") cerrar(false); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  if (!dialogo) return null;
  const { titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = "Cancelar", peligro } = dialogo;

  return (
    <div className="pk-modal-fondo pk-confirmar-fondo" onClick={() => cerrar(false)} role="presentation">
      <div className="pk-modal pk-confirmar" role="alertdialog" aria-modal="true" aria-labelledby="pk-confirmar-titulo" onClick={(e) => e.stopPropagation()}>
        <div className={`pk-confirmar-icono ${peligro ? "peligro" : ""}`}>{peligro ? <FiAlertTriangle /> : <FiHelpCircle />}</div>
        <h3 id="pk-confirmar-titulo">{titulo}</h3>
        {mensaje && <p>{mensaje}</p>}
        <div className="pk-actions">
          <button className="pk-btn pk-btn-ghost" onClick={() => cerrar(false)}>{textoCancelar}</button>
          <button className={`pk-btn ${peligro ? "pk-btn-peligro" : ""}`} onClick={() => cerrar(true)} autoFocus>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
};
