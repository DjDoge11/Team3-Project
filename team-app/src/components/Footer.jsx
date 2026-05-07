import React from 'react';
import rzLogo from './rzLogo.png';
import '../App.css'; 

export default function Footer() {
  return (
    
      <footer className="bbai-footer" aria-label="Site footer">
        
        <div className="bbai-footer__inner">
        <img src={rzLogo} alt="Company Logo" style={{ height: '3.3rem', width: '3.3rem'}} /> 
        <div className="bbai-footer__logo">
          <span>&copy; Aiju Corp.</span>
        </div>
        

        <span className="bbai-footer__note"
          style={{alignItems: 'right'}}>All rights reserved by the Nauru Parliament.</span>
        </div>
      </footer>
    
  );
}
