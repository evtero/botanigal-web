import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/progress.css";

export default function Progress() {
  const [rewardSpecies, setRewardSpecies] = useState([]);
  const [userPoints, setUserPoints] = useState(0);

  const SUPABASE_URL = "https://fhdtpzywvbgdlusjllkx.supabase.co";
  const BUCKET_NAME = "species-images";

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user?.email?.split("@")[0] || "anon";

      // puntos acumulados
      const { data: results } = await supabase
        .from("quiz_results")
        .select("finalscore")
        .eq("user", user);

      const totalPoints =
        results?.reduce((sum, r) => sum + (r.finalscore || 0), 0) || 0;
      setUserPoints(totalPoints);

      // traer species con reward_species = true
      const { data, error } = await supabase
        .from("species_feature_all") // 👈 tu tabla real
        .select("speciesid, speciesname, speciesimage, reward_species")
        .eq("reward_species", true);

      if (error) {
        console.error("❌ Error cargando reward_species:", error.message);
        return;
      }

      console.log("📦 Datos crudos reward_species:", data);

      // quedarse SOLO con la primera fila de cada speciesid
      const uniqueSpecies = Object.values(
        data.reduce((acc, sp) => {
          if (!acc[sp.speciesname]) {
            acc[sp.speciesname] = sp; // 👈 solo la primera vez
          }
          return acc;
        }, {})
      );

      console.log("✅ Especies recompensa únicas:", uniqueSpecies);
      setRewardSpecies(uniqueSpecies);
      
    };

    fetchData();
  }, []);

  useEffect(() => {
  if (rewardSpecies.length === 0 || userPoints === 0) return;

  const saveUnlocks = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user?.email?.split("@")[0] || "anon";

    for (let i = 0; i < rewardSpecies.length; i++) {
      const plant = rewardSpecies[i];
      const requiredPoints = Math.pow(2, i + 2) * 4;
      const unlocked = userPoints >= requiredPoints;

      if (unlocked) {
        const { error } = await supabase
          .from("user_unlocked_species")
          .upsert(
            { user_email: user, speciesid: plant.speciesid },
            { onConflict: ["user_email", "speciesid"] }
          );

        if (error) {
          console.error("❌ Error guardando especie desbloqueada:", error.message);
        } else {
          console.log(`🌱 Especie ${plant.speciesname} desbloqueada para ${user}`);
        }
      }
    }
  };

    saveUnlocks();
  }, [rewardSpecies, userPoints]);

  return (
    <main className="main-content">
      <div className="progress-container">
        <div className="rewards-panel">
          <h2 className="progress-message" style={{ textAlign: "center" }}>
            🍀 Consigue puntos para desbloquear nuevas especies!
          </h2>
          <h3 className="progress-points" style={{ textAlign: "center" }}>
            Tus puntos: {userPoints}
          </h3>

          <div className="card-grid">
            {rewardSpecies.map((plant, index) => {
              const requiredPoints = Math.pow(2, index + 2) * 4;
              const unlocked = userPoints >= requiredPoints;

              const progressPercent = Math.min(
                (userPoints / requiredPoints) * 100,
                100
              );

              console.log("🔍 Render card:", {
                speciesname: plant.speciesname,
                speciesimage: plant.speciesimage,
                unlocked,
                url: unlocked && plant.speciesimage
                  ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${plant.speciesimage}`
                  : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/unlock.webp`
              });

              return (
                <div className="plant-card" key={plant.speciesid}>
                  <div
                    className={`plant-image-container ${
                      unlocked ? "unlocked" : ""
                    }`}
                  >
                    <img
                      className="plant-image"
                      src={
                        unlocked && plant.speciesimage
                          ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${plant.speciesimage}.webp`
                          : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/unlock.webp`
                      }
                      alt={unlocked ? plant.speciesname : "Especie bloqueada"}
                    />
                    {unlocked && (
                      <div className="plant-name-overlay">
                        {plant.speciesname}
                      </div>
                    )}
                  </div>

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
