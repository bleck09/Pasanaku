import { useColeccion } from "./pasanakuUtils";

// "Hace 5 min", "hace 2 h", "hace 3 d"
export const hace = (ms) => {
  if (!ms) return "";
  const minutos = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} d`;
};

// Comprobantes enviados que esperan que un administrador los revise, de todos los pasanakus (el más reciente primero)
export const usePorRevisar = () => {
  const { docs: pagos } = useColeccion("pagos");
  const { docs: grupos } = useColeccion("pasanakus");
  const { docs: participantes } = useColeccion("participantes");

  return pagos
    .filter((p) => p.estado === "revision")
    .map((pago) => ({
      pago,
      grupo: grupos.find((g) => g.id === pago.pasanakuId),
      persona: participantes.find((m) => m.id === pago.participanteId),
    }))
    .filter((x) => x.grupo && x.persona)
    .sort((a, b) => (b.pago.fecha || 0) - (a.pago.fecha || 0));
};
