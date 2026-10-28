import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

// Datos de pago de un pasanaku (QR y cuenta): un documento aparte para no cargar la imagen cada vez que se listan los pasanakus
export const useCuentaPago = (grupoId, coleccion = "cuentas_pago") => {
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!grupoId) return undefined;
    const cancelar = onSnapshot(doc(db, coleccion, grupoId), (snap) => {
      setCuenta(snap.exists() ? snap.data() : null);
      setCargando(false);
    }, () => setCargando(false));
    return cancelar;
  }, [grupoId, coleccion]);

  return { cuenta, cargando };
};
