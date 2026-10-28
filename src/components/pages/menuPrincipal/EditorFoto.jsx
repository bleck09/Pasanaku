import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiCheck, FiMinus, FiMove, FiPlus } from "react-icons/fi";
import Modal from "./Modal";
import "./Pasanaku.css";

const SALIDA = 512; // la foto final es cuadrada de 512 px; la app la muestra en círculo
const ZOOM_MAX = 4;

// Ajuste de la foto de perfil: se arrastra la imagen y se hace zoom para elegir exactamente qué parte se ve en el círculo
const EditorFoto = ({ archivo, onListo, onCerrar }) => {
  const url = useMemo(() => URL.createObjectURL(archivo), [archivo]);
  const escenario = useRef(null);
  const punteros = useRef(new Map());
  const gesto = useRef(null);
  const [img, setImg] = useState(null);
  const [lado, setLado] = useState(300);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // desplazamiento del centro de la imagen respecto al centro del círculo
  const [procesando, setProcesando] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const imagen = new Image();
    imagen.onload = () => setImg(imagen);
    imagen.onerror = () => { toast.error("No se pudo abrir esa imagen."); onCerrar(); };
    imagen.src = url;
  }, [url, onCerrar]);

  useEffect(() => {
    const medir = () => { if (escenario.current) setLado(escenario.current.clientWidth); };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [img]);

  // Escala base: la imagen siempre cubre todo el cuadro
  const base = img ? Math.max(lado / img.width, lado / img.height) : 1;
  const escala = base * zoom;
  const ancho = img ? img.width * escala : 0;
  const alto = img ? img.height * escala : 0;

  const limitar = (p, esc = escala) => {
    const mx = Math.max(0, (img.width * esc - lado) / 2);
    const my = Math.max(0, (img.height * esc - lado) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };

  const cambiarZoom = (z) => {
    const nuevo = Math.min(ZOOM_MAX, Math.max(1, z));
    setZoom(nuevo);
    if (img) setPos((p) => limitar(p, base * nuevo));
  };

  const alPresionar = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesto.current = { pos, zoom, inicio: { x: e.clientX, y: e.clientY }, dist: distancia() };
  };

  const distancia = () => {
    const [a, b] = [...punteros.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const alMover = (e) => {
    if (!punteros.current.has(e.pointerId) || !img || !gesto.current) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size >= 2 && gesto.current.dist) {
      // pellizco con dos dedos
      const nuevo = Math.min(ZOOM_MAX, Math.max(1, gesto.current.zoom * (distancia() / gesto.current.dist)));
      setZoom(nuevo);
      setPos((p) => limitar(p, base * nuevo));
    } else if (punteros.current.size === 1) {
      setPos(limitar({ x: gesto.current.pos.x + e.clientX - gesto.current.inicio.x, y: gesto.current.pos.y + e.clientY - gesto.current.inicio.y }));
    }
  };

  const alSoltar = (e) => {
    punteros.current.delete(e.pointerId);
    gesto.current = punteros.current.size ? { pos, zoom, inicio: [...punteros.current.values()][0], dist: distancia() } : null;
  };

  const alRodar = (e) => {
    e.preventDefault();
    cambiarZoom(zoom - e.deltaY * 0.002);
  };

  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return undefined;
    nodo.addEventListener("wheel", alRodar, { passive: false });
    return () => nodo.removeEventListener("wheel", alRodar);
  });

  const aceptar = () => {
    if (!img) return;
    setProcesando(true);
    const r = SALIDA / lado;
    const lienzo = document.createElement("canvas");
    lienzo.width = SALIDA;
    lienzo.height = SALIDA;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SALIDA, SALIDA);
    ctx.drawImage(img, (lado / 2 + pos.x - ancho / 2) * r, (lado / 2 + pos.y - alto / 2) * r, ancho * r, alto * r);
    lienzo.toBlob((webp) => {
      if (webp && webp.type === "image/webp") return onListo(webp);
      lienzo.toBlob((jpg) => (jpg ? onListo(jpg) : (setProcesando(false), toast.error("No se pudo preparar la foto."))), "image/jpeg", 0.88);
    }, "image/webp", 0.88);
  };

  return (
    <Modal titulo="Ajusta tu foto" subtitulo="Arrastra la imagen y usa el zoom para elegir qué parte se ve en el círculo." ancho={420} onCerrar={onCerrar}>
      <div className="ef">
        <div
          className="ef-escenario" ref={escenario}
          onPointerDown={alPresionar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}
        >
          {img && (
            <img
              className="ef-imagen" src={url} alt="" draggable={false}
              style={{ width: ancho, height: alto, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
            />
          )}
          <span className="ef-mascara" />
          <span className="ef-pista"><FiMove /> Arrastra</span>
        </div>

        <div className="ef-zoom">
          <button type="button" className="pk-icon" aria-label="Alejar" onClick={() => cambiarZoom(zoom - 0.25)} disabled={zoom <= 1}><FiMinus /></button>
          <input type="range" min="1" max={ZOOM_MAX} step="0.01" value={zoom} onChange={(e) => cambiarZoom(Number(e.target.value))} aria-label="Zoom" />
          <button type="button" className="pk-icon" aria-label="Acercar" onClick={() => cambiarZoom(zoom + 0.25)} disabled={zoom >= ZOOM_MAX}><FiPlus /></button>
          <strong>{zoom.toFixed(1)}x</strong>
        </div>

        <div className="pk-actions">
          <button type="button" className="pk-btn pk-btn-ghost" onClick={onCerrar} disabled={procesando}>Cancelar</button>
          <button type="button" className="pk-btn" onClick={aceptar} disabled={!img || procesando}><FiCheck /> {procesando ? "Preparando..." : "Usar esta foto"}</button>
        </div>
      </div>
    </Modal>
  );
};

EditorFoto.propTypes = { archivo: PropTypes.object.isRequired, onListo: PropTypes.func.isRequired, onCerrar: PropTypes.func.isRequired };

export default EditorFoto;
