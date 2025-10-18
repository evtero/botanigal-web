import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../services/supabaseClient";
import "../styles/quiz.css";
import { loadValidPairs } from "../utils/quizLogic";

export default function Quiz() {
  const [quizData, setQuizData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Nuevo: controla la carga inicial
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedbackText, setFeedbackText] = useState({
    message: "",
    name: "",
    description: "",
    isCorrect: null,
  });

  const [showHint, setShowHint] = useState(false);
  const [nick, setNick] = useState(null);
  const feedbackRef = useRef(null);
  const navigate = useNavigate();

  // Cargar las preguntas al inicio
  useEffect(() => {
    setIsLoading(true);
    loadValidPairs().then((data) => {
      setQuizData(data);
      setCurrent(0);
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

  // Precarga de imágenes
  useEffect(() => {
    quizData.forEach((q) => {
      const img = new Image();
      img.src = q.image;
    });
  }, [quizData]);

  // Scroll automático al mostrar feedback
  useEffect(() => {
    if (feedbackText.message && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [feedbackText.message]);

  // Cargar nick del usuario
  useEffect(() => {
    const updateNick = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const email = user.email;
        const nickname = email.split("@")[0];
        setNick(nickname);

        const hintKey = `hasSeenHint-${nickname}`;
        const hasSeenHint = localStorage.getItem(hintKey);
        setShowHint(!hasSeenHint);
      }
    };
    updateNick();
  }, []);

  if (isLoading || !quizData[current]) {
    return <p className="loading">Cargando preguntas...</p>;
  }

  const question = quizData[current];

  const handleClick = (option) => {
    setSelected(option);
    const isCorrect = option === question.correct;
    const description = question.descriptions[option];

    if (!answered) {
      if (isCorrect) setScore((prev) => prev + 1);
      setAnswered(true);
    }

    setFeedbackText({
      message: isCorrect ? "✅ Correcto" : "❌ Incorrecto",
      name: option,
      description,
      isCorrect,
    });

    if (showHint && nick) {
      toast.info(
        "Recuerda que en cada pregunta puedes consultar la descripción de ambas opciones."
      );
      localStorage.setItem(`hasSeenHint-${nick}`, "true");
      setShowHint(false);
    }
  };

  const handleNext = async () => {
    if (current < quizData.length - 1) {
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
