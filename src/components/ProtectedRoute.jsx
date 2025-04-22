import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setChecking(false);

      if (!session) {
        navigate("/", { replace: true });
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/", { replace: true });
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  if (checking) return null;

  return session ? children : null;
}
