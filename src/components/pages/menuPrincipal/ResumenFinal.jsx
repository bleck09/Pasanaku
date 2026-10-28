import React from "react";
import PropTypes from "prop-types";
import { FiAward, FiCalendar, FiDollarSign, FiGift, FiUsers, FiEye, FiRepeat } from "react-icons/fi";
import MatrizPagos from "./MatrizPagos";
import { esConfirmado, fechaHora, fechaRonda, formatFecha, money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Resumen de un pasanaku terminado: cifras del grupo, lo que aportó y recibió cada persona, y la tabla de quién pagó
const ResumenFinal = ({ grupo, lista, pagos, entregas, n, fotos, uid, onVerEntrega }) => {
  const aportado = pagos.filter(esConfirmado).reduce((suma, p) => suma + (p.monto || 0), 0);
  const entregado = entregas.reduce((suma, e) => suma + (e.monto || 0), 0);
  const yo = uid ? lista.find((p) => p.uid === uid) : null;
  const miAporte = yo ? pagos.filter((p) => p.participanteId === yo.id && esConfirmado(p)).reduce((suma, p) => suma + (p.monto || 0), 0) : 0;
  const miEntrega = yo ? entregas.find((e) => e.participanteId === yo.id) : null;

  return (
    <div className="pk-final">
      <div className="pk-card pk-final-cab">
        <span className="pk-final-trofeo"><FiAward /></span>
        <div>
          <h2>¡Pasanaku finalizado!</h2>
          <p>Del {formatFecha(fechaRonda(grupo, 1))} al {formatFecha(fechaRonda(grupo, n))} · {n} rondas</p>
        </div>
      </div>

      <div className="pk-final-datos">
        <div><FiUsers /><span>Participantes</span><strong>{lista.length}</strong></div>
        <div><FiRepeat /><span>Rondas</span><strong>{n}</strong></div>
        <div><FiDollarSign /><span>Cuota</span><strong>{money(grupo.cuota)}</strong></div>
        <div><FiGift /><span>Pozo por ronda</span><strong>{money(grupo.cuota * n)}</strong></div>
        <div><FiCalendar /><span>Total aportado</span><strong>{money(aportado)}</strong></div>
        <div><FiAward /><span>Total entregado</span><strong>{money(entregado)}</strong></div>
      </div>

      {yo && (
        <div className="pk-card pk-final-yo">
          <h3>Tu resumen</h3>
          <div className="pk-final-yo-datos">
            <div><span>Aportaste</span><strong>{money(miAporte)}</strong></div>
            <div>
              <span>Recibiste</span>
              <strong>{miEntrega ? money(miEntrega.monto) : "—"}</strong>
              {miEntrega && <small>Ronda {miEntrega.ronda} · {fechaHora(miEntrega.fecha)}</small>}
            </div>
          </div>
          {miEntrega?.comprobanteUrl && (
            <button type="button" className="pk-btn pk-btn-ghost" onClick={() => onVerEntrega(miEntrega)}><FiEye /> Ver mi comprobante de cobro</button>
          )}
        </div>
      )}

      <div className="pk-card">
        <h3>Quién pagó en cada ronda</h3>
        <MatrizPagos grupo={grupo} lista={lista} pagos={pagos} ronda={n} n={n} enCurso={false} finalizado fotos={fotos} />
      </div>
    </div>
  );
};

ResumenFinal.propTypes = {
  grupo: PropTypes.object.isRequired,
  lista: PropTypes.array.isRequired,
  pagos: PropTypes.array.isRequired,
  entregas: PropTypes.array.isRequired,
  n: PropTypes.number.isRequired,
  fotos: PropTypes.instanceOf(Map).isRequired,
  uid: PropTypes.string,
  onVerEntrega: PropTypes.func,
};

export default ResumenFinal;
