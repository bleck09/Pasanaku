import React from "react";
import PropTypes from "prop-types";
import { FiCheck, FiClock, FiGift, FiX } from "react-icons/fi";
import Avatar from "./Avatar";
import { fechaRonda, formatFecha, resumenPago } from "./pasanakuUtils";
import "./Pasanaku.css";

// Tabla de quién pagó en cada ronda (una fila por persona, una columna por ronda) con su leyenda
const MatrizPagos = ({ grupo, lista, pagos, multas = [], ronda, n, enCurso, finalizado, fotos }) => {
  const rondas = Array.from({ length: n }, (_, i) => i + 1);
  const pagoDe = (pid, r) => resumenPago(pagos, pid, r, grupo, multas);

  return (
    <>
      <div className="pk-tabla-wrap">
        <table className="pk-matriz2">
          <thead>
            <tr>
              <th>Participante</th>
              {rondas.map((r) => (
                <th key={r} className={r === ronda && enCurso ? "actual" : ""}>
                  <span>Ronda {r}</span>
                  <small>{formatFecha(fechaRonda(grupo, r))}</small>
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const hechos = rondas.filter((r) => pagoDe(p.id, r).completo).length;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="pk-matriz2-persona">
                      <Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={34} />
                      <div><strong>{p.nombre}</strong><small>Cobra en la ronda {p.turno}</small></div>
                    </div>
                  </td>
                  {rondas.map((r) => {
                    const pago = pagoDe(p.id, r);
                    const huboPago = pago.pagado > 0 || pago.revision > 0;
                    const ya = r <= ronda || finalizado;
                    let marca = <span className="pk-marca vacio" title="Aún no corresponde" />;
                    if (pago.completo) marca = <span className="pk-marca ok" title="Pagó completo"><FiCheck /></span>;
                    else if (huboPago) marca = <span className="pk-marca parte" title={pago.pagado > 0 ? "Pagó una parte" : "Comprobante en revisión"}>{pago.pagado > 0 ? `${Math.round((pago.pagado / grupo.cuota) * 100)}%` : <FiClock />}</span>;
                    else if (ya) marca = <span className="pk-marca falta" title="Sin pagar"><FiX /></span>;
                    return (
                      <td key={r} className={r === ronda && enCurso ? "actual" : ""}>
                        {marca}
                        {r === p.turno && <small className="pk-matriz2-cobra"><FiGift /> cobra</small>}
                      </td>
                    );
                  })}
                  <td><span className="pk-matriz2-total">{hechos}/{n}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pk-leyenda">
        <span className="pk-leyenda-item"><span className="pk-marca ok mini"><FiCheck /></span> Completo</span>
        <span className="pk-leyenda-item"><span className="pk-marca parte mini">%</span> Pagó una parte</span>
        <span className="pk-leyenda-item"><span className="pk-marca parte mini"><FiClock /></span> En revisión</span>
        <span className="pk-leyenda-item"><span className="pk-marca falta mini"><FiX /></span> Sin pagar</span>
      </div>
    </>
  );
};

MatrizPagos.propTypes = {
  grupo: PropTypes.object.isRequired,
  lista: PropTypes.array.isRequired,
  pagos: PropTypes.array.isRequired,
  multas: PropTypes.array,
  ronda: PropTypes.number.isRequired,
  n: PropTypes.number.isRequired,
  enCurso: PropTypes.bool,
  finalizado: PropTypes.bool,
  fotos: PropTypes.instanceOf(Map).isRequired,
};

export default MatrizPagos;
