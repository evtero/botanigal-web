console.log("App loaded");
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Menu from "./components/Menu";
import Quiz from "./components/Quiz";
import Score from "./components/Score";
import Progress from "./components/Progress";
import Auth from "./components/Auth";

export default function App() {
  return (
    
    <Router>
      <div className="background-svg"></div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/score" element={<ProtectedRoute><Score /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}