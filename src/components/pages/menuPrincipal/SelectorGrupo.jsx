import Cargando from "./Cargando";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import BuscadorGrupo from "./BuscadorGrupo";
import { estadoGrupo, useColeccion } from "./pasanakuUtils";

// Lista de pasanakus + buscador; entrega el grupo elegido al padre
const SelectorGrupo = ({ valor, onChange, children }) => {
  const { docs: grupos, cargando } = useColeccion("pasanakus");

  useEffect(() => {
    if (grupos.length === 0) return;
    if (!valor) {
      // por defecto, el primero que está en curso (o el primero que haya)
      onChange(grupos.find((g) => estadoGrupo(g) === "En curso") || grupos[0]);
      return;
    }
    const actualizado = grupos.find((g) => g.id === valor.id);
    if (actualizado && actualizado !== valor) onChange(actualizado);
    if (!actualizado) onChange(grupos[0]);
  }, [grupos]);

  if (cargando) return <Cargando />;
  if (grupos.length === 0) return <p className="pk-vacio">Primero crea un pasanaku en la sección “Pasanakus”.</p>;

  return (
    <>
      <div className="pk-toolbar">
        <label>Pasanaku</label>
        <BuscadorGrupo grupos={grupos} valor={valor} onChange={(g) => g && onChange(g)} />
      </div>
      {valor && children}
    </>
  );
};

SelectorGrupo.propTypes = {
  valor: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default SelectorGrupo;
