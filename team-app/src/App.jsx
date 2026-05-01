import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import GPA from './pages/About';
import Courses from './pages/Services';
import Grades from './pages/Contact';
import Login from './pages/Auth';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/gpa" element={<GPA />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </>
  );
}

function userName() {
  const [user, setUser] = useState(null);

  // Monitor auth state here so it's global
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Pass the user to the Navbar */}
      <Navbar user={user} />
      <Routes>
        <Route path="/login" element={<AuthPage user={user} />} />
        {/* ... other routes */}
      </Routes>
    </>
  );
}

export function userName(){
  const [user, setUser] = useState(null);

  // Monitor auth state here so it's global
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Pass the user to the Navbar */}
      <Navbar user={user} />
      <Routes>
        <Route path="/login" element={<AuthPage user={user} />} />
        {/* ... other routes */}
      </Routes>
    </>
  );

}

export default App

