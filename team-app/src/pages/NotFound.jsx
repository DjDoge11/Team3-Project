import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.75;
    audio.muted = true;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaying(true);
          setAudioBlocked(false);
        })
        .catch(() => {
          setAudioBlocked(true);
        });
    }
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;

    const action = audio.paused ? audio.play() : audio.pause();
    if (action instanceof Promise) {
      action
        .then(() => {
          setPlaying(!audio.paused);
          setAudioBlocked(false);
          setAudioError(false);
        })
        .catch(() => {
          setAudioBlocked(true);
        });
    } else {
      setPlaying(!audio.paused);
    }
  };

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
        <button className="notfound-audio-button" type="button" onClick={toggleAudio}>
          {playing ? 'Pause Music' : 'Play Music'}
        </button>
        {(audioBlocked || audioError) && (
          <p className="notfound-audio-hint">
            {audioError
              ? 'Audio failed to load. Please confirm the file exists at /never-gonna-give-you-up.mp3.'
              : 'If the audio does not start automatically, click the button to enable background music.'}
          </p>
        )}
        <Link className="notfound-home-link" to="/home">
          Return Home
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
