import React, { useState } from "react";
import { useAtras } from "./atras";
import { FiGift, FiEye, FiSearch, FiDollarSign, FiChevronRight, FiArrowLeft, FiUser } from "react-icons/fi";
import Avatar from "./Avatar";
import VisorImagen from "./VisorImagen";
import MostrarMas from "./MostrarMas";
import Cargando from "./Cargando";
import { usePaginado } from "./usePaginado";
import { usePerfiles } from "./perfiles";
import { portadaDe } from "./portadas";
import { fechaHora, formatFecha, money, useColeccion } from "./pasanakuUtils";
import "./Pasanaku.css";

// Entregas del pozo (solo administradores): primero la lista de pasanakus con sus entregas; al abrir uno se ven sus entregas
// con quién recibió, cuánto, cuándo, qué administrador la hizo y el comprobante
const Entregas = () => {
  const { docs: entregas, cargando } = useColeccion("entregas");
  const { docs: grupos } = useColeccion("pasanakus");
  const { docs: participantes } = useColeccion("participantes");
  const { docs: autores } = useColeccion("entregas_admin");
  const fotos = usePerfiles();
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(null); // id del pasanaku cuyas entregas se ven
  useAtras(Boolean(abierto), () => { setAbierto(null); setQ(""); });
  const [ver, setVer] = useState(null);

  const filas = entregas
    .map((e) => {
      const grupo = grupos.find((g) => g.id === e.pasanakuId);
      const persona = participantes.find((p) => p.id === e.participanteId);
      const autor = autores.find((a) => a.id === e.id);
      return { ...e, grupoNombre: grupo?.nombre || "Pasanaku eliminado", personaNombre: persona?.nombre || "—", uid: persona?.uid, autor: autor?.adminNombre || "—" };
    })
    .sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

  // Una tarjeta por pasanaku que ya hizo entregas
  const porPasanaku = Object.values(filas.reduce((mapa, f) => {
    const g = mapa[f.pasanakuId] || { id: f.pasanakuId, nombre: f.grupoNombre, filas: [], total: 0, ultima: 0 };
    g.filas.push(f);
    g.total += f.monto || 0;
    g.ultima = Math.max(g.ultima, f.fecha || 0);
    mapa[f.pasanakuId] = g;
    return mapa;
  }, {})).sort((a, b) => b.ultima - a.ultima);

  const texto = q.trim().toLowerCase();
  const coincide = (f) => [f.grupoNombre, f.personaNombre, f.autor].some((t) => t.toLowerCase().includes(texto));
  const lista = porPasanaku.filter((g) => !texto || g.filas.some(coincide));
  const actual = porPasanaku.find((g) => g.id === abierto) || null;
  const filasActual = actual ? actual.filas.filter((f) => !texto || coincide(f)).sort((a, b) => (b.ronda || 0) - (a.ronda || 0)) : [];
  const paginaGrupos = usePaginado(lista, texto, 12);
  const paginaFilas = usePaginado(filasActual, `${abierto}|${texto}`, 15);
  const total = filas.reduce((suma, f) => suma + (f.monto || 0), 0);

  const abrirComprobante = (f) => setVer({ comprobanteUrl: f.comprobanteUrl, monto: f.monto, fecha: f.fecha, estado: "entregado", verbo: "Entregado", leyenda: `${f.grupoNombre} · ronda ${f.ronda} · por ${f.autor}${f.nota ? ` · ${f.nota}` : ""}` });

  return (
    <div className="pk-view">
      {actual ? (
        <>
          <button type="button" className="pk-btn pk-btn-ghost pk-entregas-volver" onClick={() => { setAbierto(null); setQ(""); }}><FiArrowLeft /> Todos los pasanakus</button>
          <div className="pk-entregas-cab" style={{ background: portadaDe(actual.nombre) }}>
            <span className="pk-entregas-cab-circ" />
            <h1>{actual.nombre}</h1>
            <p>{actual.filas.length} entrega{actual.filas.length === 1 ? "" : "s"} · {money(actual.total)} entregados</p>
          </div>
        </>
      ) : (
        <div className="pk-header">
          <div>
            <h1>Entregas del pozo</h1>
            <p>Quién recibió cada pozo, con su comprobante.</p>
          </div>
        </div>
      )}

      {!actual && (
        <div className="pk-entregas-stats">
          <div><FiGift /><span>Entregas</span><strong>{filas.length}</strong></div>
          <div><FiDollarSign /><span>Total entregado</span><strong>{money(total)}</strong></div>
        </div>
      )}

      <div className="pk-barra-filtros pk-entregas-buscar">
        <label className="pk-buscar"><FiSearch /><input placeholder={actual ? "Buscar por persona o administrador..." : "Buscar pasanaku, persona o administrador..."} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>

      {cargando ? <Cargando /> : porPasanaku.length === 0 ? (
        <p className="pk-vacio">Todavía no se ha entregado ningún pozo. Se registran con el botón &quot;Pagar pozo&quot; de cada pasanaku.</p>
      ) : actual ? (
        filasActual.length === 0 ? <p className="pk-vacio">Ninguna entrega coincide con la búsqueda.</p> : (
          <>
            <div className="pk-entregas-lista">
              {paginaFilas.visibles.map((f) => (
                <div key={f.id} className="pk-entrega-fila">
                  <span className="pk-turno" title={`Ronda ${f.ronda}`}>{f.ronda}</span>
                  <Avatar nombre={f.personaNombre} foto={fotos.get(f.uid)} tam={40} />
                  <div className="pk-entrega-info">
                    <strong>{f.personaNombre}</strong>
                    <small>{fechaHora(f.fecha)}</small>
                    <small><FiUser /> Entregó {f.autor}</small>
                  </div>
                  <div className="pk-entrega-der">
                    <strong className="pk-entrega-monto2">{money(f.monto)}</strong>
                    <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini pk-btn-ojo" title="Ver comprobante" aria-label="Ver comprobante" onClick={() => abrirComprobante(f)}><FiEye /><span className="pk-txt-ancho"> Comprobante</span></button>
                  </div>
                </div>
              ))}
            </div>
            <MostrarMas pagina={paginaFilas} />
          </>
        )
      ) : lista.length === 0 ? (
        <p className="pk-vacio">Nada coincide con la búsqueda.</p>
      ) : (
        <>
          <div className="pk-entregas-grupos">
            {paginaGrupos.visibles.map((g) => (
              <button key={g.id} type="button" className="pk-entrega-grupo" onClick={() => { setAbierto(g.id); setQ(""); }}>
                <span className="pk-fila-icono" style={{ background: portadaDe(g.nombre) }}>{g.nombre.trim().charAt(0).toUpperCase()}</span>
                <span className="pk-entrega-grupo-info">
                  <strong>{g.nombre}</strong>
                  <small>{g.filas.length} entrega{g.filas.length === 1 ? "" : "s"} · última el {formatFecha(new Date(g.ultima))}</small>
                </span>
                <span className="pk-entrega-grupo-monto">{money(g.total)}</span>
                <FiChevronRight />
              </button>
            ))}
          </div>
          <MostrarMas pagina={paginaGrupos} />
        </>
      )}

      {ver && <VisorImagen pago={ver} onCerrar={() => setVer(null)} />}
    </div>
  );
};

export default Entregas;
