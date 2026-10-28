import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiCamera, FiSave, FiTrash2 } from "react-icons/fi";
import { comprimirImagen } from "./imagenes";
import { useCuentaPago } from "./useCuentaPago";
import "./Pasanaku.css";

const aDataUrl = (blob) => new Promise((resolver, rechazar) => {
  const lector = new FileReader();
  lector.onload = () => resolver(lector.result);
  lector.onerror = () => rechazar(new Error("No se pudo leer la imagen"));
  lector.readAsDataURL(blob);
});

// El administrador sube el QR de pago del pasanaku y, si quiere, los datos de la cuenta
const PanelCuentaPago = ({ grupo }) => {
  const { cuenta, cargando } = useCuentaPago(grupo.id);
  const [qr, setQr] = useState("");
  const [campos, setCampos] = useState({ titular: "", banco: "", cuenta: "", nota: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (cargando) return;
    setQr(cuenta?.qr || "");
    setCampos({ titular: cuenta?.titular || "", banco: cuenta?.banco || "", cuenta: cuenta?.cuenta || "", nota: cuenta?.nota || "" });
  }, [cargando, cuenta]);

  const elegir = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return toast.error("El QR debe ser una imagen.");
    try {
      // los QR necesitan buen detalle: mayor tamaño y calidad que un comprobante
      const liviana = await comprimirImagen(archivo, 900, 0.92);
      if (liviana.size > 600 * 1024) return toast.error("La imagen es muy pesada. Prueba con una captura más pequeña.");
      setQr(await aDataUrl(liviana));
    } catch {
      toast.error("No se pudo leer esa imagen.");
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await setDoc(doc(db, "cuentas_pago", grupo.id), { pasanakuId: grupo.id, qr, ...campos, actualizado: Date.now() });
      await updateDoc(doc(db, "pasanakus", grupo.id), { qrListo: Boolean(qr) });
      toast.success("Datos de pago guardados");
    } catch (err) {
      console.error("Guardar cuenta de pago:", err);
      toast.error(`No se pudo guardar (${err.code || "error"}). Revisa las reglas de Firestore.`, { duration: 7000 });
    }
    setGuardando(false);
  };

  const cambiar = (campo) => (e) => setCampos({ ...campos, [campo]: e.target.value });

  return (
    <form onSubmit={guardar} className="pk-cuenta-form">
      <div className="pk-cuenta-qr">
        {qr ? (
          <div className="pk-cuenta-previa">
            <img src={qr} alt="QR de pago" />
            <span className="pk-preview-acciones">
              <label className="pk-btn pk-btn-ghost pk-btn-mini" style={{ cursor: "pointer" }}>Cambiar<input type="file" accept="image/*" onChange={elegir} hidden /></label>
              <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini pk-danger" onClick={() => setQr("")}><FiTrash2 /> Quitar</button>
            </span>
          </div>
        ) : (
          <label className="pk-subir">
            <FiCamera />
            <strong>Sube la imagen del QR</strong>
            <small>La verán los participantes al pagar y podrán descargarla</small>
            <input type="file" accept="image/*" onChange={elegir} />
          </label>
        )}
      </div>

      <div className="pk-cuenta-campos">
        <label className="pkf-campo">Titular de la cuenta<input value={campos.titular} onChange={cambiar("titular")} placeholder="Ej. Blady Chambi" maxLength={60} /></label>
        <label className="pkf-campo">Banco<input value={campos.banco} onChange={cambiar("banco")} placeholder="Ej. Banco Unión" maxLength={40} /></label>
        <label className="pkf-campo">Número de cuenta o celular<input value={campos.cuenta} onChange={cambiar("cuenta")} placeholder="Ej. 1000123456" maxLength={40} /></label>
        <label className="pkf-campo">Indicaciones<input value={campos.nota} onChange={cambiar("nota")} placeholder="Ej. Escribe tu nombre en la glosa" maxLength={140} /></label>
        <button type="submit" className="pk-btn" disabled={guardando || cargando}><FiSave /> {guardando ? "Guardando..." : "Guardar datos de pago"}</button>
      </div>
    </form>
  );
};

PanelCuentaPago.propTypes = { grupo: PropTypes.object.isRequired };

export default PanelCuentaPago;
