import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import LandingPage from "./Pages/LandingPage";
import AboutPage from "./Pages/AboutPage";
import Login from "./Pages/Login";
import EditorPage from "./Pages/EditorPage"; 
import Home from "./Pages/Room";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/createRoom" element={<Home />} />
        <Route path="/editor/:roomId/:username" element={<EditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;