// components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/"); // si no hay sesión, redirige al login
      } else {
        setChecking(false); // dejar pasar
      }
    });
  }, []);

  return checking ? null : children;
}
