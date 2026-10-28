import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiCamera, FiSave, FiTrash2, FiLock } from "react-icons/fi";
import { aDataUrl, comprimirImagen } from "./imagenes";
import { useCuentaPago } from "./useCuentaPago";
import { ocupado } from "./ocupado";
import { fechaHora } from "./pasanakuUtils";
import "./Pasanaku.css";

// Cada persona sube su propio QR: cuando le toca cobrar, el administrador lo descarga para pagarle el pozo
const QRPerfil = ({ id }) => {
  const { cuenta, cargando } = useCuentaPago(id, "cuentas_cobro");
  const [qr, setQr] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (cargando) return;
    setQr(cuenta?.qr || "");
    setNota(cuenta?.nota || "");
  }, [cargando, cuenta]);

  const elegir = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return toast.error("El QR debe ser una imagen.");
    try {
      const liviana = await comprimirImagen(archivo, 900, 0.92);
      if (liviana.size > 500 * 1024) return toast.error("La imagen es muy pesada. Prueba con una captura más pequeña.");
      setQr(await aDataUrl(liviana));
    } catch {
      toast.error("No se pudo leer esa imagen.");
    }
  };

  const guardar = async () => {
    setGuardando(true);
    const trabajo = ocupado.iniciar({ titulo: "Guardando tu QR...", texto: "Un momento." });
    try {
      await setDoc(doc(db, "cuentas_cobro", id), { qr, nota: nota.trim(), actualizado: Date.now() });
      toast.success(qr ? "QR guardado" : "QR eliminado");
    } catch (err) {
      console.error("Guardar QR de cobro:", err);
      toast.error(`No se pudo guardar (${err.code || "error"}). Revisa las reglas de Firestore.`, { duration: 7000 });
    }
    await trabajo.terminar();
    setGuardando(false);
  };

  return (
    <div className="pk-card pk-qr-perfil pk-perfil-seccion">
      <h3>Mi QR para cobrar</h3>
      <p className="pkf-nota">Cuando te toque cobrar el pozo, el administrador usará este QR para pagarte. Súbelo una vez y listo.</p>
      <div className="pk-cuenta-form">
        <div className="pk-cuenta-qr">
          {qr ? (
            <div className="pk-cuenta-previa">
              <img src={qr} alt="Mi QR de cobro" />
              <span className="pk-preview-acciones">
                <label className="pk-btn pk-btn-ghost pk-btn-mini" style={{ cursor: "pointer" }}>Cambiar<input type="file" accept="image/*" onChange={elegir} hidden /></label>
                <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini pk-danger" onClick={() => setQr("")}><FiTrash2 /> Quitar</button>
              </span>
            </div>
          ) : (
            <label className="pk-subir">
              <FiCamera />
              <strong>Sube la imagen de tu QR</strong>
              <small>Captura del QR de tu banco o billetera</small>
              <input type="file" accept="image/*" onChange={elegir} />
            </label>
          )}
        </div>
        <div className="pk-cuenta-campos">
          <label className="pkf-campo">Indicaciones (opcional)<input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Banco Unión, a nombre de..." maxLength={140} /></label>
          <button type="button" className="pk-btn" onClick={guardar} disabled={guardando || cargando}><FiSave /> {guardando ? "Guardando..." : "Guardar mi QR"}</button>
          {cuenta?.actualizado && <small className="pkf-nota">Última actualización: {fechaHora(cuenta.actualizado)}</small>}
          <small className="pkf-nota"><FiLock /> Si cambias tu QR, el administrador verá que se modificó recientemente.</small>
        </div>
      </div>
    </div>
  );
};

QRPerfil.propTypes = { id: PropTypes.string.isRequired };

export default QRPerfil;
