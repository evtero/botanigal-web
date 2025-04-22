import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { supabase } from "../services/supabaseClient";

export default function Navbar() {
  const [nick, setNick] = useState(null);
  const navigate = useNavigate();

  // Obtiene el usuario actual y extrae el nick (antes del @)
  const updateNick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const email = user.email;
      const nickname = email.split("@")[0];
      setNick(nickname);
    } else {
      setNick(null);
    }
  };

  useEffect(() => {
    // Al montar el componente, obtenemos el nick
    updateNick();

    // Escuchar cambios en la sesion (login, logout, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      updateNick();
    });

    // Al desmontar, cancelamos el listener
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Cierra sesion y redirige al login
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">🌿botanigal</h1>
      <div className="navbar-buttons">
        {nick && (
          <>
            {/* Mostrar nombre y botones solo si hay sesion */}
            <span className="nickname">{nick}</span>
            <button onClick={() => navigate("/menu")}>Inicio 🍀</button>
            <button onClick={() => navigate("/progress")}>Progreso 📈</button>
            <button onClick={handleLogout}>Salir 🚪</button>
          </>
        )}
      </div>
    </nav>
  );
}
