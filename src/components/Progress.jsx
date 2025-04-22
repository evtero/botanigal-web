// Progress.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/progress.css";

export default function Progress() {
  const [rewardSpecies, setRewardSpecies] = useState([]); // Lista de especies recompensa
  const [userPoints, setUserPoints] = useState(0); // Puntos acumulados por el usuario

  const SUPABASE_URL = "https://pxsglndjxamerugltlmr.supabase.co";
  const BUCKET_NAME = "species-images";

  useEffect(() => {
    const fetchData = async () => {
      // Obtener nombre de usuario actual
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user?.email?.split("@")[0] || "anon";

      // Calcular puntos acumulados a partir de resultados
      const { data: results } = await supabase
        .from("quiz_results")
        .select("finalscore")
        .eq("user", user);

      const totalPoints = results?.reduce((sum, r) => sum + (r.finalscore || 0), 0) || 0;
      setUserPoints(totalPoints);

      // Obtener especies desbloqueables desde la base de datos
      const { data, error } = await supabase
        .from("rewardspecies")
        .select("rewardspeciesid, rewardspeciesname, rewardspeciesimage");

      if (error) console.error("Error cargando rewardspecies:", error.message);

      // Rellenar hasta 6 cards con datos falsos si faltan. Pendiente poner mas especies.
      const filled = [
        ...data,
        ...Array.from({ length: 6 - data.length }, (_, i) => ({
          id: `placeholder-${i + 1}`,
          name: `Especie ${data.length + i + 1}`,
          image: null
        }))
      ];

      setRewardSpecies(filled.slice(0, 6)); // Limitar a 6 cards
    };

    fetchData(); // Ejecutar al montar
  }, []);

  return (
    <main className="main-content">
      <div className="progress-container">
        <div className="rewards-panel">
          <h2 className="progress-message" style={{ textAlign: "center" }}>
            🍀Consigue puntos para desbloquear nuevas especies!
          </h2>
          <h3 className="progress-points" style={{ textAlign: "center" }}>
            Tus puntos: {userPoints}
          </h3>

          {/* Cards de especies */}
          <div className="card-grid">
            {rewardSpecies.map((plant, index) => {
              const requiredPoints = Math.pow(2, index + 2) * 4; // Ej: 16, 32, 64...
              const unlocked = userPoints >= requiredPoints;

              const progressPercent = Math.min(
                (userPoints / requiredPoints) * 100,
                100
              );

              return (
                <div className="plant-card" key={plant.rewardspeciesid || index}>
                  {/* Imagen de la planta o icono de bloqueo */}
                  <div className={`plant-image-container ${unlocked ? "unlocked" : ""}`}>
                    <img
                      className="plant-image"
                      src={
                        unlocked && plant.rewardspeciesimage
                          ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${plant.rewardspeciesimage}.webp`
                          : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/unlock.webp`
                      }
                      alt={plant.rewardspeciesname}
                    />
                    {/* Nombre superpuesto solo si esta desbloqueado */}
                    {unlocked && (
                      <div className="plant-name-overlay">
                        {plant.rewardspeciesname}
                      </div>
                    )}
                  </div>

                  {/* Si no esta desbloqueada, mostrar barra de progreso */}
                  {!unlocked && (
                    <div className="plant-info">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <p>Puntos requeridos: {requiredPoints}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
