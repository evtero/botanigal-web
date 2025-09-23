console.log("Menu loaded");

import "../styles/menu.css";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate(); // Hook para navegar entre rutas

  return (
    <main className="menu-container">
      {/* Boton principal para iniciar el quiz */}
      <button onClick={() => navigate("/quiz")}>Iniciar Quiz</button>

      {/* Lista de beneficios del quiz */}
      <ul className="menu-list">
      </ul>
    </main>
  );
}
