import { useMemo } from "react";
import { useColeccion } from "./pasanakuUtils";

// Fotos de perfil públicas: colección "perfiles" (el id es el usuario del jugador o el uid del administrador)
export const usePerfiles = () => {
  const { docs } = useColeccion("perfiles");
  return useMemo(() => new Map(docs.map((d) => [d.id, d.fotoUrl || ""])), [docs]);
};
