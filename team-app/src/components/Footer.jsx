import React from 'react';

import '../App.css'; 

export default function Footer() {
  return (
    <footer className="bbai-footer" aria-label="Site footer">
      <div className="bbai-footer__inner">
        <div className="bbai-footer__logo">
          <span>&copy; Aiju Corp.</span>
        </div>

        <span className="bbai-footer__note">All rights reserved by the Nauru Parliament.</span>

      </div>
    </footer>
  );
}

