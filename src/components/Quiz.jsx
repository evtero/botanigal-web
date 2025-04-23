// Quiz.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadValidPairs } from "../utils/quizLogic";
import { supabase } from "../services/supabaseClient";
import "../styles/quiz.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Quiz() {
  // Estados para gestionar el progreso del quiz
  const [quizData, setQuizData] = useState([]);
  const [current, setCurrent] = useState(0); // pregunta actual
  const [score, setScore] = useState(0); // puntuacion actual
  const [selected, setSelected] = useState(null); // opcion seleccionada
  const [answered, setAnswered] = useState(false); // si ya se respondio
  const [feedbackText, setFeedbackText] = useState({
    message: "",
    name: "",
    description: "",
    isCorrect: null,
  }); // texto de feedback

  const feedbackRef = useRef(null);

  const navigate = useNavigate();

  const [showHint, setShowHint] = useState(() => {
    // solo se ejecuta una vez al montar el componente
    const hasSeenHint = localStorage.getItem("hasSeenHint");
    return !hasSeenHint; // si no lo ha visto, mostrarlo
  });

  // Cargar las preguntas al inicio
  useEffect(() => {
    loadValidPairs().then(setQuizData);
  }, []);

  useEffect(() => {
    if (feedbackText.message && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [feedbackText.message]);

  const question = quizData[current]; // obtener pregunta actual

  if (!question) return <p className="loading">Cargando preguntas...</p>;

  // Cuando se hace clic en una opcion
  const handleClick = (option) => {
    setSelected(option);
    const isCorrect = option === question.correct;
    const description = question.descriptions[option];

    // Solo puntuar si no se respondio antes
    if (!answered) {
      if (isCorrect) setScore((prev) => prev + 1);
      setAnswered(true);
    }

    // Mostrar retroalimentacion
    setFeedbackText({
      message: isCorrect ? "✅ Correcto" : "❌ Incorrecto",
      name: option,
      description,
      isCorrect,
    });
    if (showHint) {
      toast.info(
        "Recuerda que en cada pregunta puedes consultar la descripción de ambas opciones."
      );
      localStorage.setItem("hasSeenHint", "true");
      setShowHint(false); // opcional: para que no vuelva a entrar en esta sesión
    }
  };

  // Pasar a la siguiente pregunta/finalizar
  const handleNext = async () => {
    if (current < quizData.length - 1) {
      // Siguiente pregunta
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
      // Guardar resultados finales
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user?.email?.split("@")[0] || "anon";

      const { count } = await supabase
        .from("quiz_results")
        .select("*", { count: "exact", head: true })
        .eq("user", user);

      const ronda = (count || 0) + 1;

      const { error } = await supabase.from("quiz_results").insert({
        user,
        ronda,
        finalscore: score,
        date: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Error al guardar resultado:", error.message);
      }

      // Navegar a la pantalla de resultados
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
        {/* Encabezado con pregunta actual y puntuacion */}
        <div className="quiz-header">
          <span className="question-count">
            Pregunta {current + 1} / {quizData.length}
          </span>
          <span className="score">Puntuacion: {score}</span>
        </div>

        {/* Cuerpo principal */}
        <div className="quiz-body">
          {/* Columna izquierda: imagen */}
          <div className="quiz-image-container">
            <img src={question.image} alt="Planta" className="quiz-image" />
          </div>

          {/* Columna derecha: opciones + siguiente + feedback */}
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

              {/* Boton siguiente */}
              <div className="quiz-next">
                <button
                  className="next-button"
                  onClick={handleNext}
                  disabled={!answered}
                >
                  {"Sigue!"}
                </button>
              </div>
            </div>

            {/* feedback visual */}
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
