import React from 'react';
import rzLogo from './rzLogo.png';
import '../App.css'; 
import AuthPage from '../pages/Auth.jsx';

export default function Footer() {
  return (
    <div className="footer">
      <footer className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div className="footer-left" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src={rzLogo} alt="Company Logo" 
          style={{ height: '3.3rem', width: '3.3rem'}} />
        <span>&copy; Aiju Corp.</span>
        </div>

        <span className="footer-right-text">All rights reserved by the Nauru Parliament.</span>
      </footer>
    </div>
  );
}
