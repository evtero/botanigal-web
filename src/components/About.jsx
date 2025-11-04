// About.jsx
import { useEffect } from "react";
import "../styles/about.css";

export default function About() {
  useEffect(() => {
    // Si en el futuro necesitas cargar algo desde Supabase o hacer un efecto secundario, hazlo aquí.
  }, []);

  return (
    <main className="about-container">
      <h2>🌿 Acerca de Botanigal</h2>
      <p>
        Este proyecto utiliza imágenes propias y fotografías de{" "}
        <a
          href="https://www.inaturalist.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          iNaturalist
        </a>{" "}
        compartidas por sus usuarios bajo licencia{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        .
      </p>
    </main>
  );
}
