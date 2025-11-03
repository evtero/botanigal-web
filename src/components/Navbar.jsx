import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { supabase } from "../services/supabaseClient";


export default function Navbar() {
  const menuRef = useRef(null);
  const [nick, setNick] = useState(null);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú desplegable

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
  
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

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
    <>
      <nav className="navbar">
        <h1 className="navbar-title">🌿botanigal</h1>
        {nick && <span className="nickname desktop-only">{nick}</span>}
        
        {nick && (
          <div className="navbar-buttons desktop-only">
            <button onClick={() => navigate("/menu")}>Inicio 🍀</button>
            <button onClick={() => navigate("/progress")}>Progreso 📈</button>
            <button onClick={() => navigate("/about")}>Acerca de ℹ️</button>
            <button onClick={handleLogout}>Salir 🚪</button>
          </div>
        )}


        {nick && (
          <span className="nickname-mobile mobile-only">{nick}</span>
        )}
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</div>
      </nav>

      {/* Slide menu solo en móvil */}
      {nick && (
        
        <div ref={menuRef} className={`slide-menu ${isMenuOpen ? "open" : ""}`}>
          <button onClick={() => { navigate("/menu"); setIsMenuOpen(false); }}>Inicio</button>
          <button onClick={() => { navigate("/progress"); setIsMenuOpen(false); }}>Progreso</button>
          <button onClick={() => { navigate("/about"); setIsMenuOpen(false); }}>Acerca de</button>
          <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Salir</button>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>X</button>
        </div>
      )}
    </>
  );
}
