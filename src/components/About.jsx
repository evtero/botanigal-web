// About.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/about.css";

export default function About() {
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    const fetchAuthors = async () => {
      const { data, error } = await supabase
        .from("species_feature_all")
        .select("speciesname, copyrigth");

      if (error) {
        console.error("❌ Error cargando autorías:", error.message);
        return;
      }

      // Agrupar especies por usuario (copyrigth)
      const grouped = data.reduce((acc, row) => {
        if (!row.copyrigth) return acc;
        if (!acc[row.copyrigth]) acc[row.copyrigth] = new Set();
        acc[row.copyrigth].add(row.speciesname);
        return acc;
      }, {});

      // Convertir a array de strings: "usuario: especie1, especie2"
      const formatted = Object.entries(grouped).map(
        ([author, speciesSet]) => `${author}: ${[...speciesSet].join(", ")}`
      );

      setAuthors(formatted);
    };

    fetchAuthors();
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

      <p>Autorías de imágenes y descripciones:</p>
      <p className="authors-text">
        {authors.length > 0
        ? authors.join("; ")
        : "Cargando lista de autorías..."}
    </p>

    </main>
  );
}
