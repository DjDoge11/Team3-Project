import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GPA from './pages/About';
import Courses from './pages/Services';
import Grades from './pages/Contact';
import Login from './pages/Blog';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gpa" element={<GPA />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App

