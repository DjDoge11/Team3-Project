import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
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
    <nav className="navbar">
      <ul className="bbai-navLinks">
        <li><Link className="bbai-navLink" to="/home">Home</Link></li>
        <li><Link className="bbai-navLink" to="/gpa">GPA</Link></li>
        <li><Link className="bbai-navLink" to="/courses">Courses</Link></li>
        <li><Link className="bbai-navLink" to="/grades">Grades</Link></li>
        <li><Link className="bbai-navLink" to="/login">Login</Link></li>
        <li><div className="username">
        {user ? (
          <p>{user.email}</p>
        ) : (
          <p>Guest</p>
        )}
      </div></li>
      </ul>
    </nav>
  );
}
