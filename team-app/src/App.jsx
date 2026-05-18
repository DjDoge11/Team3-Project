import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import GPA from './pages/About';
import Courses from './pages/Services';
import Grades from './pages/Contact';
import Login from './pages/Auth';
import Tetris from './pages/Tetris';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <div className="bbai-app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/gpa" element={<GPA />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

