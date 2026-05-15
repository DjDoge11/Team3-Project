import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.9;
    audio.muted = false;
    audio.load();
    audio.play();
  }, []);

  return (
    <main className="notfound-page">
      <audio
        ref={audioRef}
        loop
        autoPlay
        preload="auto"
        aria-label="Never Gonna Give You Up background music"
        onError={() => setAudioError(true)}
      >
        <source src="/never-gonna-give-you-up.mp3" type="audio/mpeg" />
      </audio>
      <section className="notfound-card">
        <div className="notfound-badge">404</div>
        <h1>Page Not Found</h1>
        <p>
          We couldn’t find the page you were looking for. Check the URL or return to the homepage.
        </p>

        <Link className="notfound-home-link" to="/home">
          Return Home
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
