import React from 'react';
import rzLogo from './rzLogo.png';
import '../App.css'; 

export default function Footer() {
  return (
    
      <footer className="bbai-footer" aria-label="Site footer">
        
        <div className="bbai-footer__inner">
          <div className="bbai-footer__logo">
            <img src={rzLogo} alt="Company Logo" />
            <span>© Aiju Corp.</span>
          </div>
          <span className="bbai-footer__note">All rights reserved by the Nauru Parliament.</span>
        </div>
      </footer>
    
  );
}
