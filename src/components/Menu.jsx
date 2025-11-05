console.log("Menu loaded");

import { useNavigate } from "react-router-dom";
import "../styles/menu.css";

export default function Menu() {
  const navigate = useNavigate(); // Hook para navegar entre rutas

  return (
    <main className="menu-container">
      <p className="intro-text">
        ¡Comienza el quiz y aprende a reconocer distintas especies!
      </p>
      {/* Boton principal para iniciar el quiz */}
      <button onClick={() => navigate("/quiz")}>Iniciar Quiz</button>

      {/* Lista de beneficios del quiz */}
      <ul className="menu-list"></ul>
    </main>
  );
}
