import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav class = "navbar">
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

