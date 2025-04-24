import { supabase } from "../services/supabaseClient";

const SUPABASE_URL = "https://pxsglndjxamerugltlmr.supabase.co"; 
const BUCKET_NAME = "species-images";

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}


export async function loadValidPairs() {
  const { data: speciesList, error } = await supabase
    .from("species")
    .select(`
      speciesid,
      speciesname,
      speciesfamily,
      speciesimage,
      species_feature (
        feature:features (
          category,
          featuredescription
        )
      )
    `);

  if (error) {
    console.error("Error al cargar especies:", error.message);
    return [];
  }

  const usedImages = new Set();
  const validPairs = [];

  const shuffledSpecies = shuffle([...speciesList]);

  for (let i = 0; i < shuffledSpecies.length; i++) {
    for (let j = i + 1; j < shuffledSpecies.length; j++) {
      const A = shuffledSpecies[i];
      const B = shuffledSpecies[j];

      if (
        A.speciesname === B.speciesname ||
        A.speciesfamily !== B.speciesfamily
      ) continue;

      const match = A.species_feature.find((fa) =>
        B.species_feature.some(
          (fb) =>
            fb.feature.category === fa.feature.category &&
            fb.feature.featuredescription !== fa.feature.featuredescription
        )
      );

      if (!match) continue;

      const category = match.feature.category;

      const descA = A.species_feature.find(f => f.feature.category === category)?.feature.featuredescription;
      const descB = B.species_feature.find(f => f.feature.category === category)?.feature.featuredescription;

      if (!descA || !descB) continue;

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${A.speciesimage}.webp`;

      if (usedImages.has(imageUrl)) continue;

      validPairs.push({
        image: imageUrl,
        correct: A.speciesname,
        distractor: B.speciesname,
        options: shuffle([A.speciesname, B.speciesname]),
        descriptions: {
          [A.speciesname]: descA,
          [B.speciesname]: descB
        }
      });

      usedImages.add(imageUrl);
    }
  }

  const finalPairs = shuffle(validPairs).slice(0, 5); // Selecciona 5 aleatorios
  console.log("Pares válidos generados aleatoriamente:", finalPairs);
  return finalPairs;
}

