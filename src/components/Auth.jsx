import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/auth.css";

export default function Auth() {
  const navigate = useNavigate();

  // Estado para cambiar entre login y registro
  const [mode, setMode] = useState("login"); // "login" o "register"

  // Estados para formulario
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Si el usuario ya tiene sesion activa, redirige al menu
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/menu");
    });
  }, []);

  // Maneja envio del formulario (login o registro)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = `${nick}@local.app`;

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) setMessage(`⚠️ ${error.message}`);
    else navigate("/menu");
  };

  useEffect(() => {
    (async () => {
      const session = await supabase.auth.getSession();
      console.log("🔍 getSession:", session);
      const user = await supabase.auth.getUser();
      console.log("👤 getUser:", user);
    })();
  }, []);

  return (
    <div className="auth-wrapper single">
      <div className="auth-panel">
        <p className="auth-intro">
          Descubre y aprende sobre especies de plantas con este quiz!{" "}
        </p>
        <h2>
          {mode === "login" ? "🌸 Inicia sesión 🌸" : "🌱 Nuevo usuario 🌱"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nickname"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">
            {mode === "login" ? "Entrar" : "Registrarse"}
          </button>
        </form>

        {/* Muestra mensajes de error */}
        {message && <p className="auth-message">{message}</p>}

        {/* Alternar entre login y registro */}
        {mode === "login" ? (
          <p className="auth-toggle">
            ¿No tienes usuario creado?{" "}
            <span onClick={() => setMode("register")}>
              Crea un usuario para jugar
            </span>
          </p>
        ) : (
          <p className="auth-toggle">
            ¿Ya tienes usuario?{" "}
            <span onClick={() => setMode("login")}>Inicia sesión</span>
          </p>
        )}
      </div>
    </div>
  );
}
