import React from "react";
import PropTypes from "prop-types";
import { FiChevronDown } from "react-icons/fi";
import "./Pasanaku.css";

// Pie de lista: "Mostrando 20 de 1.043" y el botón para ver la siguiente tanda
const MostrarMas = ({ pagina }) => {
  if (pagina.total <= 20 && pagina.restantes === 0) return null;
  return (
    <div className="pk-mas pk-mas-pie">
      <small>Mostrando {pagina.mostrados.toLocaleString("es")} de {pagina.total.toLocaleString("es")}</small>
      {pagina.restantes > 0 && (
        <button type="button" className="pk-btn pk-btn-ghost" onClick={pagina.mostrarMas}>
          <FiChevronDown /> Mostrar más ({pagina.restantes.toLocaleString("es")} restantes)
        </button>
      )}
    </div>
  );
};

MostrarMas.propTypes = {
  pagina: PropTypes.shape({ mostrados: PropTypes.number, total: PropTypes.number, restantes: PropTypes.number, mostrarMas: PropTypes.func }).isRequired,
};

export default MostrarMas;
