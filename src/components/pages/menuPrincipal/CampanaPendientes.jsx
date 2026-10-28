import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiBell, FiCheckCircle } from "react-icons/fi";
import Avatar from "./Avatar";
import { usePerfiles } from "./perfiles";
import { useFuera } from "./useFuera";
import { hace, usePorRevisar } from "./usePorRevisar";
import { money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Campana del administrador: avisa de los comprobantes por revisar y lleva directo al pago de esa persona
const CampanaPendientes = ({ onIr }) => {
  const items = usePorRevisar();
  const fotos = usePerfiles();
  const [abierta, setAbierta] = useState(false);
  const caja = useRef(null);
  const cerrar = useCallback(() => setAbierta(false), []);
  useFuera(caja, abierta, cerrar);

  return (
    <div className="pk-campana" ref={caja}>
      <button type="button" className="pk-campana-boton" onClick={() => setAbierta(!abierta)} aria-label={`Pagos por revisar: ${items.length}`} aria-expanded={abierta}>
        <FiBell />
        {items.length > 0 && <b>{items.length > 9 ? "9+" : items.length}</b>}
      </button>

      {abierta && (
        <div className="pk-campana-panel" role="dialog" aria-label="Pagos por revisar">
          <div className="pk-campana-cab">
            <strong>Por revisar</strong>
            <small>{items.length === 0 ? "Todo al día" : `${items.length} comprobante${items.length === 1 ? "" : "s"}`}</small>
          </div>
          {items.length === 0 ? (
            <p className="pk-campana-vacio"><FiCheckCircle /> No hay pagos esperando revisión.</p>
          ) : (
            <ul>
              {items.slice(0, 8).map(({ pago, grupo, persona }) => (
                <li key={pago.id}>
                  <button type="button" onClick={() => { cerrar(); onIr({ grupoId: grupo.id, participanteId: persona.id, ronda: pago.ronda }); }}>
                    <Avatar nombre={persona.nombre} foto={fotos.get(persona.uid)} tam={34} />
                    <span>
                      <strong>{persona.nombre} · {money(pago.monto)}</strong>
                      <small>{grupo.nombre} · Ronda {pago.ronda} · {hace(pago.fecha)}</small>
                    </span>
                  </button>
                </li>
              ))}
              {items.length > 8 && <li className="pk-campana-mas">y {items.length - 8} más...</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

CampanaPendientes.propTypes = { onIr: PropTypes.func.isRequired };

export default CampanaPendientes;
