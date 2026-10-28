import React, { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";

// Franja fija cuando no hay internet: se pueden ver los datos guardados, pero los pagos y cambios necesitan conexión
const AvisoSinConexion = () => {
  const [sinRed, setSinRed] = useState(!navigator.onLine);
  useEffect(() => {
    const cambiar = () => setSinRed(!navigator.onLine);
    window.addEventListener("online", cambiar);
    window.addEventListener("offline", cambiar);
    return () => { window.removeEventListener("online", cambiar); window.removeEventListener("offline", cambiar); };
  }, []);
  if (!sinRed) return null;
  return <div className="pk-sin-red" role="status"><FiWifiOff /> Sin conexión: puedes ver tus datos guardados, pero los pagos y cambios necesitan internet.</div>;
};

export default AvisoSinConexion;
