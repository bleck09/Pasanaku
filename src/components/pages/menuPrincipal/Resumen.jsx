import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiPlay, FiAward, FiDollarSign, FiSend, FiLayers, FiAlertCircle } from "react-icons/fi";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PorRevisarCard from "./PorRevisarCard";
import Cargando from "./Cargando";
import { esConfirmado, estaIniciado, resumenPago, money, useColeccion } from "./pasanakuUtils";
import "./Pasanaku.css";

const PERIODOS = [["mes", "Este mes"], ["anio", "Este año"], ["todo", "Todo"]];

const desde = (periodo) => {
  const hoy = new Date();
  if (periodo === "mes") return new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime();
  if (periodo === "anio") return new Date(hoy.getFullYear(), 0, 1).getTime();
  return 0;
};

// Resumen general del administrador: cifras de TODOS los pasanakus, por periodo. Nada es de un grupo en particular.
const Resumen = ({ onIr = () => {} }) => {
  const { docs: grupos, cargando } = useColeccion("pasanakus");
  const { docs: participantes } = useColeccion("participantes");
  const { docs: todosPagos } = useColeccion("pagos");
  const { docs: entregas } = useColeccion("entregas");
  const { docs: multas } = useColeccion("multas");
  const [periodo, setPeriodo] = useState("mes");
  const pagos = useMemo(() => todosPagos.filter(esConfirmado), [todosPagos]);
  const inicio = desde(periodo);
  const enPeriodo = (ms) => (ms || 0) >= inicio;

  // Estado actual de los pasanakus
  const activos = grupos.filter((g) => estaIniciado(g) && g.estado !== "finalizado");
  const finalizados = grupos.filter((g) => g.estado === "finalizado");
  const armando = grupos.filter((g) => !estaIniciado(g));

  // Del periodo elegido
  const fechaFin = (g) => Math.max(0, ...entregas.filter((e) => e.pasanakuId === g.id).map((e) => e.fecha || 0)) || g.finalizadoEn || g.creado || 0;
  const iniciados = grupos.filter((g) => estaIniciado(g) && enPeriodo(g.iniciadoEn || g.creado)).length;
  const terminados = finalizados.filter((g) => enPeriodo(fechaFin(g))).length;
  const recaudado = pagos.filter((p) => enPeriodo(p.fecha)).reduce((suma, p) => suma + (p.monto || 0), 0);
  const entregasPeriodo = entregas.filter((e) => enPeriodo(e.fecha));
  const entregado = entregasPeriodo.reduce((suma, e) => suma + (e.monto || 0), 0);

  // Rondas actuales de los pasanakus en curso: cumplimiento y cuotas pendientes
  const actuales = activos.map((g) => {
    const lista = participantes.filter((p) => p.pasanakuId === g.id);
    const estado = lista.map((q) => resumenPago(pagos, q.id, g.rondaActual, g, multas));
    return { meta: estado.reduce((suma, r) => suma + r.cuotaTotal, 0), n: lista.length, completos: estado.filter((r) => r.completo).length, pagado: estado.reduce((suma, r) => suma + r.pagado, 0), falta: estado.reduce((suma, r) => suma + r.falta, 0) };
  });
  const cuotasPendientes = actuales.reduce((suma, r) => suma + (r.n - r.completos), 0);
  const montoPendiente = actuales.reduce((suma, r) => suma + r.falta, 0);
  const meta = actuales.reduce((suma, r) => suma + r.meta, 0);
  const cumplimiento = meta ? Math.round((actuales.reduce((suma, r) => suma + r.pagado, 0) / meta) * 100) : 0;
  const listos = actuales.filter((r) => r.n > 0 && r.completos === r.n).length;
  const personas = new Set(participantes.filter((p) => activos.some((g) => g.id === p.pasanakuId)).map((p) => p.uid || p.id)).size;

  // Aportado y entregado por mes (últimos 6 meses)
  const porMes = useMemo(() => {
    const hoy = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      return { clave: `${d.getFullYear()}-${d.getMonth()}`, mes: d.toLocaleDateString("es-BO", { month: "short" }).replace(".", ""), Aportado: 0, Entregado: 0 };
    });
    const sumar = (lista, campo) => lista.forEach((x) => {
      if (!x.fecha) return;
      const d = new Date(x.fecha);
      const m = meses.find((y) => y.clave === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m[campo] += x.monto || 0;
    });
    sumar(pagos, "Aportado");
    sumar(entregas, "Entregado");
    return meses;
  }, [pagos, entregas]);

  if (cargando) return <Cargando />;

  const total = grupos.length || 1;
  const hayDatos = porMes.some((m) => m.Aportado > 0 || m.Entregado > 0);
  const etiquetaPeriodo = PERIODOS.find(([id]) => id === periodo)[1].toLowerCase();

  return (
    <div className="pk-view">
      <div className="pk-header">
        <div>
          <h1>Resumen</h1>
          <p>Cifras de todos tus pasanakus.</p>
        </div>
        <div className="pk-segmento pk-resumen-periodo" role="tablist">
          {PERIODOS.map(([id, texto]) => <button key={id} type="button" className={periodo === id ? "activo" : ""} onClick={() => setPeriodo(id)}>{texto}</button>)}
        </div>
      </div>

      <PorRevisarCard onIr={onIr} />

      <h3 className="pk-subtitulo">{periodo === "todo" ? "Desde el inicio" : `Durante ${etiquetaPeriodo}`}</h3>
      <div className="pk-metricas">
        <div className="pk-metrica azul"><span className="pk-metrica-icono"><FiPlay /></span><div><strong>{iniciados}</strong><span>Pasanakus iniciados</span></div></div>
        <div className="pk-metrica verde"><span className="pk-metrica-icono"><FiAward /></span><div><strong>{terminados}</strong><span>Pasanakus finalizados</span></div></div>
        <div className="pk-metrica celeste"><span className="pk-metrica-icono"><FiDollarSign /></span><div><strong>{money(recaudado)}</strong><span>Recaudado en cuotas</span></div></div>
        <div className="pk-metrica ambar"><span className="pk-metrica-icono"><FiSend /></span><div><strong>{money(entregado)}</strong><span>Entregado en pozos<br />({entregasPeriodo.length} entrega{entregasPeriodo.length === 1 ? "" : "s"})</span></div></div>
      </div>

      <h3 className="pk-subtitulo">Ahora mismo</h3>
      <div className="pk-resumen-grid">
        <div className="pk-card">
          <div className="pk-ronda-cab"><h3><FiLayers /> Estado de los pasanakus</h3><span className="pk-etiqueta">{grupos.length} en total</span></div>
          <div className="pk-estados-barra" aria-hidden="true">
            <i className="curso" style={{ width: `${(activos.length / total) * 100}%` }} />
            <i className="armando" style={{ width: `${(armando.length / total) * 100}%` }} />
            <i className="fin" style={{ width: `${(finalizados.length / total) * 100}%` }} />
          </div>
          <ul className="pk-estados-leyenda">
            <li><i className="curso" /> <strong>{activos.length}</strong> en curso</li>
            <li><i className="armando" /> <strong>{armando.length}</strong> por iniciar</li>
            <li><i className="fin" /> <strong>{finalizados.length}</strong> finalizados</li>
          </ul>
          <p className="pk-estados-pie"><strong>{personas}</strong> persona{personas === 1 ? "" : "s"} jugando en los pasanakus en curso</p>
        </div>

        <div className="pk-card">
          <div className="pk-ronda-cab"><h3><FiAlertCircle /> Cuotas de las rondas actuales</h3><span className="pk-etiqueta">{cumplimiento}% al día</span></div>
          <span className="pk-metrica-barra grande"><i style={{ width: `${cumplimiento}%` }} /></span>
          <div className="pk-cuotas-datos">
            <div><strong>{cuotasPendientes}</strong><span>cuotas pendientes</span></div>
            <div><strong>{money(montoPendiente)}</strong><span>por cobrar</span></div>
            <div><strong>{listos}</strong><span>pozo{listos === 1 ? "" : "s"} listo{listos === 1 ? "" : "s"} para entregar</span></div>
          </div>
        </div>
      </div>

      <div className="pk-card">
        <div className="pk-ronda-cab"><h3>Aportado y entregado por mes</h3><span className="pk-etiqueta">Últimos 6 meses</span></div>
        {hayDatos ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={porMes} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3ECF7" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#66788F", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#66788F", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, nombre) => [money(v), nombre]} cursor={{ fill: "rgba(74,143,214,0.08)" }} contentStyle={{ borderRadius: 12, border: "1px solid #DCE6F2" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Aportado" fill="#4A8FD6" radius={[8, 8, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Entregado" fill="#2E9A6B" radius={[8, 8, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="pk-vacio" style={{ marginTop: "1rem" }}>Aún no hay aportes ni entregas registrados.</p>}
      </div>
    </div>
  );
};

Resumen.propTypes = { onIr: PropTypes.func };

export default Resumen;
