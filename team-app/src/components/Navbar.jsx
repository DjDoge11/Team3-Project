import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate for redirect
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Added signOut

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login after signing out
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <nav className="navbar">
      <ul className="bbai-navLinks">
        <li><Link className="bbai-navLink" to="/home">Home</Link></li>
        <li><Link className="bbai-navLink" to="/gpa">GPA</Link></li>
        <li><Link className="bbai-navLink" to="/courses">Courses</Link></li>
        <li><Link className="bbai-navLink" to="/grades">Grades</Link></li>
        
        {/* Conditional Rendering starts here */}
        <li>
          {user ? (
            <Link className="bbai-navLink" to="/login">Logout</Link>
          ) : (
            <Link className="bbai-navLink" to="/login">Login</Link>
          )}
        </li>
      </ul>

      <div className="nav-user-container">
        <div className="username">
          {user ? <p>{user.email}</p> : <p>Guest</p>}
        </div>
      </div>
    </nav>
  );
}