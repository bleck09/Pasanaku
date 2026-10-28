import React, { useState } from "react";
import { FiGift, FiEye, FiSearch, FiFileText } from "react-icons/fi";
import Avatar from "./Avatar";
import VisorImagen from "./VisorImagen";
import MostrarMas from "./MostrarMas";
import { usePaginado } from "./usePaginado";
import { usePerfiles } from "./perfiles";
import { fechaHora, money, useColeccion } from "./pasanakuUtils";
import Cargando from "./Cargando";
import "./Pasanaku.css";

// Historial de entregas del pozo (solo administradores): qué pasanaku, a quién, cuánto, cuándo, qué administrador y el comprobante
const Entregas = () => {
  const { docs: entregas, cargando } = useColeccion("entregas");
  const { docs: grupos } = useColeccion("pasanakus");
  const { docs: participantes } = useColeccion("participantes");
  const { docs: autores } = useColeccion("entregas_admin");
  const fotos = usePerfiles();
  const [q, setQ] = useState("");
  const [ver, setVer] = useState(null);

  const filas = entregas
    .map((e) => {
      const grupo = grupos.find((g) => g.id === e.pasanakuId);
      const persona = participantes.find((p) => p.id === e.participanteId);
      const autor = autores.find((a) => a.id === e.id);
      return { ...e, grupoNombre: grupo?.nombre || "Pasanaku eliminado", personaNombre: persona?.nombre || "—", uid: persona?.uid, autor: autor?.adminNombre || "—" };
    })
    .sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

  const texto = q.trim().toLowerCase();
  const visibles = filas.filter((f) => !texto || [f.grupoNombre, f.personaNombre, f.autor].some((t) => t.toLowerCase().includes(texto)));
  const pagina = usePaginado(visibles, texto);
  const total = filas.reduce((suma, f) => suma + (f.monto || 0), 0);

  const abrir = (f) => setVer({ comprobanteUrl: f.comprobanteUrl, monto: f.monto, fecha: f.fecha, estado: "entregado", verbo: "Entregado", leyenda: `${f.grupoNombre} · ronda ${f.ronda} · por ${f.autor}${f.nota ? ` · ${f.nota}` : ""}` });

  return (
    <div className="pk-view">
      <div className="pk-header">
        <div>
          <h1>Entregas del pozo</h1>
          <p>Historial de quién recibió cada pozo, con su comprobante y el administrador que lo entregó.</p>
        </div>
      </div>

      <div className="pk-stats">
        <div className="pk-card pk-stat"><FiGift size={26} /><div><span>Entregas realizadas</span><strong>{filas.length}</strong></div></div>
        <div className="pk-card pk-stat"><FiFileText size={26} /><div><span>Total entregado</span><strong>{money(total)}</strong></div></div>
      </div>

      <div className="pk-barra-filtros">
        <label className="pk-buscar"><FiSearch /><input placeholder="Buscar por pasanaku, persona o administrador..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>

      {cargando ? <Cargando /> : visibles.length === 0 ? (
        <p className="pk-vacio">{texto ? "Ninguna entrega coincide con la búsqueda." : "Todavía no se ha entregado ningún pozo. Se registran desde el calendario de cada pasanaku."}</p>
      ) : (
        <>
          <div className="pk-card pk-tabla-wrap">
            <table className="pk-tabla">
              <thead><tr><th>Fecha</th><th>Pasanaku</th><th>Ronda</th><th>Recibió</th><th>Monto</th><th>Entregó</th><th>Comprobante</th></tr></thead>
              <tbody>
                {pagina.visibles.map((f) => (
                  <tr key={f.id}>
                    <td>{fechaHora(f.fecha)}</td>
                    <td><strong>{f.grupoNombre}</strong></td>
                    <td>{f.ronda}</td>
                    <td><span className="pk-persona"><Avatar nombre={f.personaNombre} foto={fotos.get(f.uid)} tam={30} />{f.personaNombre}</span></td>
                    <td>{money(f.monto)}</td>
                    <td>{f.autor}</td>
                    <td><button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => abrir(f)}><FiEye /> Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MostrarMas pagina={pagina} />
        </>
      )}

      {ver && <VisorImagen pago={ver} onCerrar={() => setVer(null)} />}
    </div>
  );
};

export default Entregas;
