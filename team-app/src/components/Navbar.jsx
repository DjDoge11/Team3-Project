import { Link } from 'react-router-dom';
import logo from './rzLogo.png';

export default function Navbar() {
  return (
    <nav className="bbai-navbar" aria-label="Primary">
      <div className="bbai-navbar__inner">
        <div className="bbai-brand" aria-label="Site brand">
          <img className="bbai-brand__mark" src={logo} alt="" />
          <span className="bbai-brand__name">CCA Grade & Credit Planner</span>
        </div>

        <ul className="bbai-navLinks">
          <li>
            <Link className="bbai-navLink" to="/home">
              Home
            </Link>
          </li>

          <li>
            <Link className="bbai-navLink" to="/courses">
              Courses
            </Link>
          </li>
          <li>
            <Link className="bbai-navLink" to="/grades">
              Grades
            </Link>
          </li>
          <li>
            <Link className="bbai-navLink" to="/login">
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}





