// Score.jsx
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/score.css";

export default function Score() {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtenemos datos de la ronda desde la navegacion (estado pasado desde Quiz)
  const { score = 0, total = 0, ronda = "" } = location.state || {};

  let emoji = "💀"; // default

  const ratio = score / total;

  if (ratio === 1)
    emoji = "🏆"; // Perfecto
  else if (ratio >= 0.8)
    emoji = "😄"; // Excelente
  else if (ratio >= 0.6)
    emoji = "😊"; // Bien
  else if (ratio >= 0.4)
    emoji = "🙁"; // Regular
  else if (ratio >= 0.2)
    emoji = "💀"; // Muy bajo
  else emoji = "💀"; // Terrible

  return (
    <div className="score-container">
      {/* Numero de ronda DESCARTADO */}
      <h1 className="score-title">Ronda actual</h1>

      {/* Puntuacion obtenida y emoji segun resultado */}
      <h2 className="score-subtitle">
        Puntuacion: {score} / {total} {emoji}
      </h2>

      <button className="score-button" onClick={() => navigate("/quiz")}>
        Volver a jugar
      </button>

      <button className="score-button" onClick={() => navigate("/progress")}>
        Ver progreso
      </button>
    </div>
  );
}
