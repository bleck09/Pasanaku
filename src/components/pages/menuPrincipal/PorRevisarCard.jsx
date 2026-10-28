import React from "react";
import PropTypes from "prop-types";
import { FiCheckCircle, FiChevronRight, FiInbox } from "react-icons/fi";
import Avatar from "./Avatar";
import { usePerfiles } from "./perfiles";
import { hace, usePorRevisar } from "./usePorRevisar";
import { money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Tarjeta del Resumen del administrador: comprobantes que esperan revisión, de todos los pasanakus
const PorRevisarCard = ({ onIr }) => {
  const items = usePorRevisar();
  const fotos = usePerfiles();

  if (items.length === 0) {
    return <div className="pk-card pk-revisar-ok"><FiCheckCircle /><div><strong>Todo al día</strong><small>No hay comprobantes esperando revisión.</small></div></div>;
  }

  return (
    <div className="pk-card pk-revisar">
      <div className="pk-ronda-cab">
        <h3><FiInbox /> Por revisar</h3>
        <span className="pk-chip pk-chip-rev">{items.length} pendiente{items.length === 1 ? "" : "s"}</span>
      </div>
      <ul>
        {items.slice(0, 5).map(({ pago, grupo, persona }) => (
          <li key={pago.id}>
            <button type="button" onClick={() => onIr({ grupoId: grupo.id, participanteId: persona.id, ronda: pago.ronda })}>
              <Avatar nombre={persona.nombre} foto={fotos.get(persona.uid)} tam={38} />
              <span className="pk-revisar-info">
                <strong>{persona.nombre} <b>{money(pago.monto)}</b></strong>
                <small>{grupo.nombre} · Ronda {pago.ronda} · {hace(pago.fecha)}</small>
              </span>
              <span className="pk-revisar-ir">Revisar <FiChevronRight /></span>
            </button>
          </li>
        ))}
      </ul>
      {items.length > 5 && <small className="pkf-nota">y {items.length - 5} más. Usa la campana de arriba para verlos.</small>}
    </div>
  );
};

PorRevisarCard.propTypes = { onIr: PropTypes.func.isRequired };

export default PorRevisarCard;
