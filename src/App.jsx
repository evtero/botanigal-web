console.log("App loaded");
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import About from "./components/About";
import Auth from "./components/Auth";
import Menu from "./components/Menu";
import Navbar from "./components/Navbar";
import Progress from "./components/Progress";
import ProtectedRoute from "./components/ProtectedRoute";
import Quiz from "./components/Quiz";
import Score from "./components/Score";
// Deploy update trigger

export default function App() {
  return (
    <Router basename="/botanigal-web">
      <div className="background-svg"></div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/score"
          element={
            <ProtectedRoute>
              <Score />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}
