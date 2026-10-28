import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiCheck, FiRefreshCw, FiAward } from "react-icons/fi";
import PodioOrden from "./PodioOrden";
import Rueda from "./Rueda";
import ConfigAvanzada from "./ConfigAvanzada";
import GanadorModal from "./GanadorModal";
import BotonSonido from "./BotonSonido";
import { fanfarria, leerSonido, programarTicks } from "./sonido";
import { estadoSorteo, prepararGiro } from "./ruedaUtils";
import "./Pasanaku.css";

// Sorteo del orden de cobro: se gira de a uno, quien sale se retira de la rueda y ocupa el siguiente lugar libre.
// Los lugares pedidos por los participantes (configuración avanzada) quedan fijos y se marcan como "Pedido".
const SorteoTurnos = ({ lista, fotos, grupoId, onListo }) => {
  const [fijas, setFijas] = useState([]);
  const [sorteados, setSorteados] = useState([]); // ids en el orden en que salieron
  const [giro, setGiro] = useState(0);
  const [girando, setGirando] = useState(false);
  const [pendiente, setPendiente] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [anuncio, setAnuncio] = useState(null);
  const [sonido, setSonido] = useState(leerSonido);

  const personas = useMemo(() => lista.map((p) => ({ id: p.id, nombre: p.nombre })), [lista]);
  const fijasOk = fijas.filter((f) => f.pos <= lista.length);

  const estado = estadoSorteo(lista, fijasOk, sorteados);
  const ruedaPersonas = estado.rueda;
  const sorteables = ruedaPersonas.map((p, i) => (p.reservado ? -1 : i)).filter((i) => i >= 0); // posiciones de la rueda que pueden salir
  const orden = estado.orden;
  const completo = estado.completo;
  const siguiente = estado.posicion;
  const empezado = sorteados.length > 0;

  const porId = (id) => lista.find((p) => p.id === id);

  const reiniciar = () => { setSorteados([]); setPendiente(null); setAnuncio(null); };

  const girar = () => {
    if (girando || ruedaPersonas.length < 1) return;
    const forzado = estado.fija ? ruedaPersonas.findIndex((p) => p.id === estado.fija.id) : undefined;
    const { idx, giro: nuevo } = prepararGiro(ruedaPersonas.length, giro, forzado, sorteables);
    setAnuncio(null);
    if (sonido) programarTicks(giro, nuevo, ruedaPersonas.length);
    setPendiente(ruedaPersonas[idx]);
    setGirando(true);
    setGiro(nuevo);
  };

  const terminar = () => {
    if (!girando) return;
    setGirando(false);
    setSorteados((prev) => [...prev, pendiente.id]);
    if (sonido) fanfarria();
    setAnuncio({ nombre: pendiente.nombre, foto: fotos.get(pendiente.uid), detalle: `Turno ${siguiente}${estado.fija ? " · Pedido" : ""}` });
  };

  const confirmar = async () => {
    setGuardando(true);
    try {
      const lote = writeBatch(db);
      orden.forEach((o, i) => lote.update(doc(db, "participantes", o.id), { turno: i + 1 }));
      if (grupoId) lote.update(doc(db, "pasanakus", grupoId), { ordenListo: true });
      await lote.commit();
      toast.success("Orden de cobro guardado");
      onListo();
    } catch (err) {
      console.error("Guardar orden:", err);
      toast.error(`No se pudo guardar el orden (${err.code || "error"}).`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pk-ruleta-layout">
      {anuncio && !girando && <GanadorModal nombre={anuncio.nombre} foto={anuncio.foto} detalle={anuncio.detalle} onCerrar={() => setAnuncio(null)} />}
      <div className="pk-ruleta-escena">
        <BotonSonido activo={sonido} onCambio={setSonido} />
        {completo ? (
          <div className="pk-ruleta-fin">
            <span className="pk-trofeo"><FiAward /></span>
            <strong>¡Sorteo terminado!</strong>
            <p>{orden.length} turnos asignados. Revisen el orden y confirmen.</p>
          </div>
        ) : (
          <>
            <Rueda opciones={ruedaPersonas} giro={giro} girando={girando} onFin={terminar} onGirar={girar} desactivado={ruedaPersonas.length < 1} />
            <p className="pk-ruleta-leyenda">{girando ? "Girando..." : `Toca el centro para girar el turno ${siguiente}`}</p>
            <small className="pkf-nota">{sorteables.length === 1 && !estado.fija ? "Queda una sola persona para este lugar." : `Quien sale se retira de la rueda. Quedan ${sorteables.length} por sortear.`}{ruedaPersonas.some((p) => p.reservado) && " Las porciones grises con 🔒 ya tienen un lugar pedido."}</small>
            {estado.fija && <small className="pkf-nota pk-aviso-pedido"> El turno {siguiente} es un pedido de <strong>{porId(estado.fija.id)?.nombre}</strong>: la ruleta gira y se detiene en esa persona.</small>}
          </>
        )}
      </div>

      <div className="pk-ruleta-panel">
        <span className="pk-etiqueta">Orden de cobro</span>
        <PodioOrden
          items={orden.map((o) => {
            const p = o && porId(o.id);
            return p ? { nombre: p.nombre, foto: fotos.get(p.uid), fijo: o.fijo } : { pendiente: true };
          })}
        />

        <div className="pk-actions" style={{ justifyContent: "flex-start" }}>
          {empezado && <button type="button" className="pk-btn pk-btn-ghost" onClick={reiniciar} disabled={girando || guardando}><FiRefreshCw /> Volver a sortear</button>}
          {completo && <button type="button" className="pk-btn" onClick={confirmar} disabled={guardando}><FiCheck /> {guardando ? "Guardando..." : "Confirmar este orden"}</button>}
        </div>
        {completo && <small className="pkf-nota">Si todos están de acuerdo, confirma. Esto reemplaza el orden actual; si no, vuelve a sortear.</small>}

        <ConfigAvanzada personas={personas} fijas={fijasOk} onCambio={setFijas} total={lista.length} bloqueado={empezado || girando} />
      </div>
    </div>
  );
};

SorteoTurnos.propTypes = {
  lista: PropTypes.array.isRequired,
  fotos: PropTypes.instanceOf(Map).isRequired,
  grupoId: PropTypes.string,
  onListo: PropTypes.func.isRequired,
};

export default SorteoTurnos;
