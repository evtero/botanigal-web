import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../services/supabaseClient";
import "../styles/quiz.css";
import { loadValidPairs } from "../utils/quizLogic";

export default function Quiz() {
  const [quizData, setQuizData] = useState([]); // array con todas las preguntas generadas para el quiz
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0); // indice de la pregunta actual dentro del array quizData
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedbackText, setFeedbackText] = useState({
    message: "",
    name: "",
    description: "",
    isCorrect: null,
  });

  const [showHint, setShowHint] = useState(false); // controla si se muestra el mensaje de ayuda inicial
  const [nick, setNick] = useState(null); // nick del usuario
  const feedbackRef = useRef(null);
  const navigate = useNavigate(); // hook de React Router para navegar a otras paginas (ej: pantalla final)

  // Cargar las preguntas al inicio // useEffect(funcion, [dependencias])
  useEffect(() => {
    setIsLoading(true);
    loadValidPairs().then((data) => {
      // esta funcion consulta a Supabase para generar los pares validos de preguntas
      setQuizData(data); // guardar las preguntas generadas en el estado principal del quiz
      setCurrent(0); // reiniciar estados para la ronda
      setScore(0);
      setSelected(null);
      setAnswered(false);
      setFeedbackText({
        message: "",
        name: "",
        description: "",
        isCorrect: null,
      });
      setIsLoading(false);
    });
  }, []);

  // Precarga de imágenes // se ejecuta cada vez que quizData cambie
  useEffect(() => {
    // recorre todas las preguntas cargadas
    quizData.forEach((q) => {
      const img = new Image();
      img.src = q.image;
    });
  }, [quizData]);

  // Scroll automático al mostrar feedback // PRESCINCIBLE, solo mejora experiencia usuario
  useEffect(() => {
    if (feedbackText.message && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [feedbackText.message]);

  // Cargar nick del usuario // Se ejecuta solo al iniciar el quiz
  useEffect(() => {
    const updateNick = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser(); // obtiene el usuario actual autenticado
      if (user) {
        const email = user.email;
        const nickname = email.split("@")[0];
        setNick(nickname);

        const hintKey = `hasSeenHint-${nickname}`;
        const hasSeenHint = localStorage.getItem(hintKey); // para mostrar el aviso inicial una vez por usuario PRESCINCIBLE
        setShowHint(!hasSeenHint);
      }
    };
    updateNick();
  }, []);

  // Si no estan cargadas las preguntas mostrar un mensaje
  if (isLoading || !quizData[current]) {
    return <p className="loading">Cargando preguntas...</p>;
  }

  //// PREGUNTA ACTUAL DEL QUIZ ////
  const question = quizData[current];

  // Descripción que se mostrará en preguntas tipo "description"
  const promptDescription = question.descriptions?.[question.correct] || "";

  // funcion que se ejcuta cuando el usuario pulsa una opción
  const handleClick = (option) => {
    setSelected(option); // guarda opcion seleccionada
    const isCorrect = option === question.correct;
    const description = question.descriptions[option];
    const family = question.families[option];

    // solo cuenta la respuesta la primera vez que se pulsa
    if (!answered) {
      if (isCorrect) setScore((prev) => prev + 1); // sube score si es correcta
      setAnswered(true);
    }

    // actualiza el texto de feedback que se mostrará al usuario
    setFeedbackText({
      message: isCorrect ? "✅ Correcto" : "❌ Incorrecto",
      name: option,
      description,
      family,
      isCorrect,
    });

    // mensaje de ayuda unico por partida de jugador
    if (showHint && nick) {
      toast.info(
        "Recuerda que en cada pregunta puedes consultar la descripción de ambas opciones. PERO solo se cuenta la primera que selecciones.",
        { autoClose: 8000 },
      );
      localStorage.setItem(`hasSeenHint-${nick}`, "true");
      setShowHint(false);
    }
  };

  const handleNext = async () => {
    if (current < quizData.length - 1) {
      // si todavia quedan preguntas, pasar a la siguiente
      setCurrent((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
      setFeedbackText({
        message: "",
        name: "",
        description: "",
        isCorrect: null,
      });
    } else {
      // si era la ultima pregunta, obtiene el usuario actual
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user?.email?.split("@")[0] || "anon";

      // Cuenta cuantas rondas previas tiene ese usuario
      const { count } = await supabase
        .from("quiz_results")
        .select("*", { count: "exact", head: true })
        .eq("user", user);

      const ronda = (count || 0) + 1; // nueva ronda es la siguiente

      // guarda resultado en BD
      const { error } = await supabase.from("quiz_results").insert({
        user,
        ronda,
        finalscore: score,
        date: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Error al guardar resultado:", error.message);
      }

      // navega a la pantalla final para mostrar resultado
      navigate("/score", {
        state: {
          score,
          total: quizData.length,
          ronda,
        },
      });
    }
  };

  return (
    <div className="quiz-container">
      <div className="quiz-content">
        <div className="quiz-header">
          <span className="question-count">
            {current + 1} / {quizData.length}
          </span>
          <span className="score">Puntuacion: {score}</span>
        </div>

        <div className="quiz-body">
          <div className="quiz-image-wrapper">
            {question.type === "description" ? (
              <div className="quiz-description-mode">
                <p className="quiz-description-prompt">{promptDescription}</p>
              </div>
            ) : (
              <>
                <div className="quiz-image-container">
                  <img
                    src={question.image}
                    alt="Planta"
                    className="quiz-image"
                    loading="eager"
                  />
                </div>
                <p className="quiz-copyright">
                  © {question.copyrigth || "Autor desconocido"}
                </p>
              </>
            )}
          </div>

          <div className="quiz-right">
            <div className="quiz-options">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`quiz-option ${
                    answered && selected === opt
                      ? question.correct === opt
                        ? "correct"
                        : "incorrect"
                      : ""
                  }`}
                  onClick={() => handleClick(opt)}
                >
                  {opt}
                </button>
              ))}
              <div className="quiz-next">
                <button
                  className="next-button"
                  onClick={handleNext}
                  disabled={!answered}
                >
                  Sigue!
                </button>
              </div>
            </div>

            <div className="quiz-feedback" ref={feedbackRef}>
              {feedbackText.message && (
                <div className="feedback-content">
                  <p
                    className={`feedback-message ${
                      feedbackText.isCorrect
                        ? "feedback-correct"
                        : "feedback-incorrect"
                    }`}
                  >
                    {feedbackText.message}
                  </p>
                  <p className="feedback-name">{feedbackText.name}</p>
                  {question.commonNames &&
                    (() => {
                      const common = question.commonNames[feedbackText.name];
                      if (!common) return null;
                      const spa = common.spa?.toLowerCase() || "";
                      const gal = common.gal?.toLowerCase() || "";
                      if (!spa && !gal) return null;
                      const same = spa === gal;
                      return (
                        <p className="quiz-common">
                          {same ? spa : [spa, gal].filter(Boolean).join(", ")}
                        </p>
                      );
                    })()}

                  {feedbackText.family && (
                    <p className="quiz-family">F. {feedbackText.family}</p>
                  )}
                  {/* family added */}
                  <p
                    className={`feedback-description ${
                      feedbackText.isCorrect
                        ? "feedback-correct"
                        : "feedback-incorrect"
                    }`}
                  >
                    {feedbackText.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3500} hideProgressBar />
    </div>
  );
}
