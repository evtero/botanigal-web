import { supabase } from "../services/supabaseClient";

const BUCKET_NAME = "species-images";

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

export async function loadValidPairs() {
  console.log("🔄 Cargando especies para el quiz...");

  // 🔑 1. Usuario actual
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user?.email?.split("@")[0] || "anon";

  // 🔑 2. Especies base (reward_species = false)
  const { data: baseSpecies, error: baseError } = await supabase
    .from("species_feature_all")
    .select(
      `
      featureid,
      featuredescription,
      featurecategory,
      speciesid,
      speciesname,
      speciescname_spa,
      speciescname_gal,
      speciescname_eng,
      speciesfamily,
      speciesimage,
      reward_species,
      copyrigth,
      image_code
    `
    )
    .eq("reward_species", false);

  if (baseError) {
    console.error("❌ Error al cargar especies base:", baseError.message);
    return [];
  }

  // 🔑 3. Especies desbloqueadas por el usuario
  const { data: unlockedList, error: unlockedError } = await supabase
    .from("user_unlocked_species")
    .select("speciesid")
    .eq("user_email", user);

  if (unlockedError) {
    console.error(
      "❌ Error cargando especies desbloqueadas:",
      unlockedError.message
    );
    return [];
  }

  const unlockedIds = unlockedList?.map((u) => u.speciesid) || [];

  let unlockedSpecies = [];
  if (unlockedIds.length > 0) {
    const { data, error } = await supabase
      .from("species_feature_all")
      .select(
        `
        featureid,
        featuredescription,
        featurecategory,
        speciesid,
        speciesname,
        speciescname_spa,
        speciescname_gal,
        speciescname_eng,
        speciesfamily,
        speciesimage,
        reward_species,
        copyrigth,
        image_code
      `
      )
      .in("speciesid", unlockedIds);

    if (error) {
      console.error(
        "❌ Error cargando detalles de especies desbloqueadas:",
        error.message
      );
    } else {
      unlockedSpecies = data || [];
    }
  }

  // 🔑 4. Combinar base + desbloqueadas
  const rows = [...(baseSpecies || []), ...unlockedSpecies];

  console.log(`✅ ${rows.length} filas disponibles para el quiz.`);
  console.table(rows.slice(0, 10));

  const usedImages = new Set();
  const validPairs = [];

  const shuffled = shuffle([...rows]);
  console.log("🔀 Especies barajadas:", shuffled.length);

  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const A = shuffled[i];
      const B = shuffled[j];

      // 🚨 condiciones: misma categoría, distinto speciesname
      if (A.featurecategory !== B.featurecategory) continue;
      if (A.speciesname === B.speciesname) continue;

      // const {
      //   data: { publicUrl },
      // } = supabase.storage
      //   .from(BUCKET_NAME)
      //   .getPublicUrl(`${A.speciesimage}.webp`);
      // const imageUrl = `${
      //   import.meta.env.VITE_SUPABASE_FUNCTION_URL
      // }/get-image/${A.image_code}`;
      const imageUrl = `https://fhdtpzywvbgdlusjllkx.functions.supabase.co/get-image/${A.image_code}`;
      const publicUrl = imageUrl;

      if (usedImages.has(publicUrl)) {
        console.log(`⚠️ Imagen repetida: ${publicUrl}, se salta.`);
        continue;
      }

      const pair = {
        image: publicUrl,
        correct: A.speciesname,
        distractor: B.speciesname,
        options: shuffle([A.speciesname, B.speciesname]),
        commonNames: {
          [A.speciesname]: {
            spa: A.speciescname_spa,
            gal: A.speciescname_gal,
          },
          [B.speciesname]: {
            spa: B.speciescname_spa,
            gal: B.speciescname_gal,
          },
        },
        descriptions: {
          [A.speciesname]: A.featuredescription,
          [B.speciesname]: B.featuredescription,
        },
        copyrigth: A.copyrigth,
        families: {
          [A.speciesname]: A.speciesfamily,
          [B.speciesname]: B.speciesfamily,
        },
      };

      validPairs.push(pair);
      usedImages.add(publicUrl);
    }
  }

  const finalPairs = shuffle(validPairs).slice(0, 10);
  console.log(`🎉 Total pares generados: ${validPairs.length}`);
  console.log(`🎯 Pares devueltos: ${finalPairs.length}`);
  console.log("Ejemplo de copyrigth:", rows[0]?.copyrigth);
  console.table(finalPairs);

  return finalPairs;
}
