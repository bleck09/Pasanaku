import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { deleteField, doc, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import { useColeccion } from "./pasanakuUtils";

// Tarea de una sola vez, solo para administradores: las cuentas antiguas guardaban el hash de la contraseña en su perfil público.
// Aquí se pasa a la colección privada "claves" y se borra del perfil. Si no hay nada pendiente, no hace nada.
const MigracionSeguridad = () => {
  const { docs: jugadores } = useColeccion("jugadores");
  const trabajando = useRef(false);

  useEffect(() => {
    const pendientes = jugadores.filter((j) => j.hash);
    if (pendientes.length === 0 || trabajando.current) return;
    trabajando.current = true;
    (async () => {
      try {
        for (let i = 0; i < pendientes.length; i += 200) {
          const lote = writeBatch(db);
          pendientes.slice(i, i + 200).forEach((j) => {
            lote.set(doc(db, "claves", j.id), { hash: j.hash });
            lote.update(doc(db, "jugadores", j.id), { hash: deleteField(), previo: deleteField() });
          });
          await lote.commit();
        }
        toast.success(`Seguridad de ${pendientes.length} cuenta${pendientes.length === 1 ? "" : "s"} actualizada.`);
      } catch (err) {
        console.error("Migración de seguridad:", err);
        toast.error("No se pudo actualizar la seguridad de las cuentas de jugadores. ¿Publicaste las reglas nuevas de Firestore?", { duration: 9000 });
        trabajando.current = false;
      }
    })();
  }, [jugadores]);

  return null;
};

export default MigracionSeguridad;
