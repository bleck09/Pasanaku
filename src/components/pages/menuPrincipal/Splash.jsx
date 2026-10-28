import React from "react";
import Cerdito3D from "../home/Cerdito3D";
import "./Splash.css";

// Pantalla de carga al abrir el sistema: la alcancía rebota mientras se comprueba la sesión
const Splash = () => (
  <div className="splash" role="status" aria-live="polite">
    <span className="splash-deco d1" aria-hidden="true" />
    <span className="splash-deco d2" aria-hidden="true" />
    <div className="splash-cerdo"><Cerdito3D /></div>
    <span className="splash-sombra" aria-hidden="true" />
    <h2 className="splash-marca"><b>PASA</b>NAKU</h2>
    <p className="splash-texto">Preparando tu información<span className="splash-puntos" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>
    <div className="splash-barra" aria-hidden="true"><span /></div>
  </div>
);

export default Splash;
