import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase'; // Adjust path as needed
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
<<<<<<< Updated upstream
    <nav className = "navbar">
=======
    <nav className="navbar">
        <nav className="username">
        {user ? (
          <p><strong>{user.email}</strong></p>) : (
          <p>Guest</p>)}
        </nav>
>>>>>>> Stashed changes
      <ul>
      <li><Link to="/home">Home</Link></li>
        <li><Link to="/gpa">GPA</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        <li><Link to="/grades">Grades</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
}
