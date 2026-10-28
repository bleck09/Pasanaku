import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiCamera, FiFileText, FiX } from "react-icons/fi";
import { comprimirImagen, esPdf, kb, MAX_PDF } from "./imagenes";
import "./Pasanaku.css";

// Zona para elegir o arrastrar un comprobante (imagen o PDF) con vista previa. El archivo ya listo se entrega con onArchivo.
const SubirComprobante = ({ archivo, onArchivo }) => {
  const [tamano, setTamano] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const vista = useMemo(() => (archivo && !esPdf(archivo) ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => { if (vista) URL.revokeObjectURL(vista); }, [vista]);

  const recibir = async (original) => {
    if (!original) return;
    if (esPdf(original)) {
      if (original.size > MAX_PDF) return toast.error(`El PDF pesa ${kb(original.size)}; el máximo es 5 MB.`);
      setTamano(kb(original.size));
      onArchivo(original);
      return;
    }
    if (!original.type.startsWith("image/")) return toast.error("Sube una imagen o un PDF.");
    try {
      const liviana = await comprimirImagen(original);
      setTamano(`${kb(original.size)} → ${kb(liviana.size)}`);
      onArchivo(liviana);
    } catch {
      toast.error("No se pudo leer esa imagen. Prueba con otra.");
    }
  };

  const elegir = (e) => {
    const original = e.target.files[0];
    e.target.value = "";
    recibir(original);
  };

  if (archivo) {
    return (
      <div className="pk-preview-caja">
        {esPdf(archivo) ? <div className="pk-preview pk-preview-pdf"><FiFileText /><strong>PDF</strong></div> : <img className="pk-preview" src={vista} alt="Vista previa del comprobante" />}
        <div className="pk-preview-info">
          <strong className="pk-preview-nombre">{esPdf(archivo) ? "PDF listo" : "Imagen lista"}</strong>
          <small>{esPdf(archivo) ? tamano : `Optimizada: ${tamano}`}</small>
          <span className="pk-preview-acciones">
            <label className="pk-btn pk-btn-ghost pk-btn-mini" style={{ cursor: "pointer" }}>
              Cambiar<input type="file" accept="image/*,application/pdf" onChange={elegir} hidden />
            </label>
            <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => { setTamano(""); onArchivo(null); }}><FiX /> Quitar</button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <label
      className={`pk-subir ${arrastrando ? "arrastrando" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastrando(false); recibir(e.dataTransfer.files[0]); }}
    >
      <FiCamera />
      <strong>Toca para elegir o arrastra aquí</strong>
      <small>Foto, captura o PDF (hasta 5 MB)</small>
      <input type="file" accept="image/*,application/pdf" onChange={elegir} />
    </label>
  );
};

SubirComprobante.propTypes = { archivo: PropTypes.object, onArchivo: PropTypes.func.isRequired };

export default SubirComprobante;
