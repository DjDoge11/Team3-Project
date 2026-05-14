import "/src/App.css";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ROWS = 20;
const COLS = 10;

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const COLORS = {
  I: '#3FBDF0',
  J: '#2A6F97',
  L: '#F7B32B',
  O: '#F25F5C',
  S: '#8AC926',
  T: '#9D4EDD',
  Z: '#FF6B6B',
};

const randomType = () => {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
};

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ''));

const rotateShape = (shape) =>
  shape[0].map((_, index) => shape.map((row) => row[row.length - 1 - index]));

const makePiece = (type) => {
  const shape = SHAPES[type].map((row) => row.map((cell) => (cell ? type : '')));
  return {
    type,
    shape,
    color: COLORS[type],
    position: { x: Math.floor((COLS - shape[0].length) / 2), y: 0 },
  };
};

const isValidPosition = (board, shape, position) => {
  for (let row = 0; row < shape.length; row += 1) {
    for (let col = 0; col < shape[row].length; col += 1) {
      if (!shape[row][col]) continue;
      const x = position.x + col;
      const y = position.y + row;

      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y >= 0 && board[y][x]) return false;
    }
  }
  return true;
};

const mergeBoard = (board, piece) => {
  const nextBoard = board.map((row) => [...row]);
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        const x = piece.position.x + colIndex;
        const y = piece.position.y + rowIndex;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          nextBoard[y][x] = piece.color;
        }
      }
    });
  });
  return nextBoard;
};

const clearLines = (board) => {
  const completed = board.filter((row) => row.some((cell) => !cell));
  const linesCleared = ROWS - completed.length;
  const newBoard = Array.from({ length: linesCleared }, () => Array.from({ length: COLS }, () => '')).concat(completed);
  return [newBoard, linesCleared];
};

export default function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextType, setNextType] = useState(randomType());
  const [score, setScore] = useState(0);
  const [rowsCleared, setRowsCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [highScoreMessage, setHighScoreMessage] = useState('');
  const [savingHighScore, setSavingHighScore] = useState(false);
  const [hasSavedScore, setHasSavedScore] = useState(false);

  const resetGame = () => {
    const firstPieceType = randomType();
    const upcomingPieceType = randomType();

    setBoard(createEmptyBoard());
    setScore(0);
    setRowsCleared(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
    setHasSavedScore(false);
    setHighScoreMessage('');
    setNextType(upcomingPieceType);
    setCurrentPiece(makePiece(firstPieceType));
    setPlaying(true);
    setStarted(true);
  };

  const updateLevel = (newRows) => {
    const nextLevel = Math.max(1, 1 + Math.floor(newRows / 10));
    setLevel(nextLevel);
  };

  const landPieceAt = (landPosition, piece = currentPiece) => {
    if (!piece) return;
    let newBoard;
    setBoard((prevBoard) => {
      const merged = mergeBoard(prevBoard, { ...piece, position: landPosition });
      const [clearedBoard, lines] = clearLines(merged);
      if (lines > 0) {
        setScore((value) => value + lines * 100);
        setRowsCleared((previousRows) => {
          const nextRows = previousRows + lines;
          updateLevel(nextRows);
          return nextRows;
        });
      }
      newBoard = clearedBoard;
      return clearedBoard;
    });

    const incomingPiece = makePiece(nextType);
    setNextType(randomType());
    setCurrentPiece(incomingPiece);

    if (!isValidPosition(newBoard ?? board, incomingPiece.shape, incomingPiece.position)) {
      setGameOver(true);
      setPlaying(false);
    }
  };

  const moveRelative = (dx, dy) => {
    if (!currentPiece || paused || gameOver) return;
    const nextPosition = { x: currentPiece.position.x + dx, y: currentPiece.position.y + dy };
    if (isValidPosition(board, currentPiece.shape, nextPosition)) {
      setCurrentPiece((piece) => ({ ...piece, position: nextPosition }));
      return true;
    }
    if (dy === 1) {
      landPieceAt(currentPiece.position);
    }
    return false;
  };

  const rotateCurrent = () => {
    if (!currentPiece || paused || gameOver) return;
    const rotated = rotateShape(currentPiece.shape);
    const canRotate = isValidPosition(board, rotated, currentPiece.position);
    if (canRotate) {
      setCurrentPiece((piece) => ({ ...piece, shape: rotated }));
      return;
    }

    const offsets = [-1, 1, -2, 2];
    for (const xOffset of offsets) {
      if (isValidPosition(board, rotated, { x: currentPiece.position.x + xOffset, y: currentPiece.position.y })) {
        setCurrentPiece((piece) => ({ ...piece, shape: rotated, position: { ...piece.position, x: piece.position.x + xOffset } }));
        return;
      }
    }
  };

  const hardDrop = () => {
    if (!currentPiece || paused || gameOver) return;
    let targetY = currentPiece.position.y;
    while (isValidPosition(board, currentPiece.shape, { x: currentPiece.position.x, y: targetY + 1 })) {
      targetY += 1;
    }
    landPieceAt({ x: currentPiece.position.x, y: targetY });
  };

  const displayBoard = useMemo(() => {
    const grid = board.map((row) => [...row]);
    if (currentPiece) {
      currentPiece.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const x = currentPiece.position.x + colIndex;
            const y = currentPiece.position.y + rowIndex;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
              grid[y][x] = currentPiece.color;
            }
          }
        });
      });
    }
    return grid;
  }, [board, currentPiece]);

  useEffect(() => {
    if (!playing || paused || gameOver || !currentPiece) return undefined;
    const interval = window.setInterval(() => {
      moveRelative(0, 1);
    }, Math.max(200, 700 - (level - 1) * 50));

    return () => window.clearInterval(interval);
  }, [playing, paused, gameOver, board, currentPiece, level]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!playing || gameOver || !currentPiece) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveRelative(-1, 0);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveRelative(1, 0);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveRelative(0, 1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        rotateCurrent();
      }
      if (event.key === ' ') {
        event.preventDefault();
        hardDrop();
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, gameOver, board, currentPiece, paused]);

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const bestQuery = query(collection(db, 'tetris-highscores'), orderBy('score', 'desc'), limit(1));
        const snapshot = await getDocs(bestQuery);
        if (!snapshot.empty) {
          setBestScore(snapshot.docs[0].data().score || 0);
        }
      } catch (error) {
        console.error('Unable to load high score', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    loadInitialState();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!gameOver || !started || score <= 0 || savingHighScore || hasSavedScore) return;

    const saveHighScore = async () => {
      setSavingHighScore(true);
      try {
        await addDoc(collection(db, 'tetris-highscores'), {
          score,
          best: score > bestScore,
          userId: user?.uid || null,
          email: user?.email || 'Guest',
          createdAt: serverTimestamp(),
        });

        if (score > bestScore) {
          setBestScore(score);
          setHighScoreMessage('New high score saved!');
        } else {
          setHighScoreMessage('Score saved to Firestore.');
        }

        setHasSavedScore(true);
      } catch (error) {
        console.error('Could not save high score', error);
        setHighScoreMessage('Unable to save score right now.');
      } finally {
        setSavingHighScore(false);
      }
    };

    saveHighScore();
  }, [gameOver, started, score, savingHighScore, hasSavedScore, user, bestScore]);

  const nextGrid = useMemo(() => {
    const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ''));
    const shape = SHAPES[nextType];
    shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          grid[rowIndex][colIndex] = COLORS[nextType];
        }
      });
    });
    return grid;
  }, [nextType]);

  return (
    <main className="tetris-page">
      <section className="home-hero bbai-hero">
        <div>
          <span className="home-eyebrow">Fun Break</span>
          <h1 className="bbai-title">Tetris</h1>
          <p className="bbai-subtitle">
            Use the arrow keys to move, up to rotate, down to soft drop, space to hard drop, and P to pause.
          </p>
          <div className="tetris-header-actions">
            {!started && (
              <button className="home-cta-button" type="button" onClick={resetGame}>
                Start Tetris
              </button>
            )}
            <Link to="/home" className="home-cta-button">Back to Home</Link>
          </div>
          <p className="tetris-user-badge">
            {user?.email ? `Signed in as ${user.email}` : 'Playing anonymously. Sign in to attach your high score to your account.'}
          </p>
          <p className="tetris-highscore-note">Top global score: {bestScore}</p>
          {highScoreMessage && <p className="tetris-highscore-note">{highScoreMessage}</p>}
        </div>
      </section>

      <section className="tetris-wrapper">
        <div className="tetris-board" role="grid" aria-label="Tetris board">
          {displayBoard.map((row, rowIndex) => (
            <div key={rowIndex} className="tetris-row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className="tetris-cell"
                  style={{
                    backgroundColor: cell || 'rgba(255, 255, 255, 0.08)',
                    boxShadow: cell
                      ? 'inset 0 0 0 1px rgba(255,255,255,0.45), 0 0 0 1px rgba(255,255,255,0.1)'
                      : 'none',
                  }}
                />
              ))}
            </div>
          ))}
          {!started && (
            <div className="tetris-overlay">
              <strong>Ready to Play?</strong>
              <span>Click Start Tetris to begin the game.</span>
            </div>
          )}
          {gameOver && started && (
            <div className="tetris-overlay">
              <strong>Game Over</strong>
              <span>Press Restart to play again.</span>
            </div>
          )}
          {paused && started && !gameOver && (
            <div className="tetris-overlay">
              <strong>Paused</strong>
              <span>Press P to resume.</span>
            </div>
          )}
        </div>

        <aside className="tetris-info">
          <div className="tetris-panel">
            <div className="tetris-stats">
              <div>
                <strong>Score</strong>
                <p>{score}</p>
              </div>
              <div>
                <strong>Best</strong>
                <p>{bestScore}</p>
              </div>
              <div>
                <strong>Level</strong>
                <p>{level}</p>
              </div>
              <div>
                <strong>Lines</strong>
                <p>{rowsCleared}</p>
              </div>
            </div>

            <div className="tetris-next">
              <strong>Next</strong>
              <div className="tetris-next-grid">
                {nextGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className="tetris-row small-grid">
                    {row.map((cell, colIndex) => (
                      <div
                        key={colIndex}
                        className="tetris-cell"
                        style={{
                          backgroundColor: cell || 'rgba(255, 255, 255, 0.08)',
                          boxShadow: cell
                            ? 'inset 0 0 0 1px rgba(255,255,255,0.45), 0 0 0 1px rgba(255,255,255,0.1)'
                            : 'none',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="tetris-controls">
              <button className="home-cta-button" type="button" onClick={resetGame}>
                Restart
              </button>
              <button className="home-cta-button" type="button" onClick={() => setPaused((value) => !value)}>
                {paused ? 'Resume' : 'Pause'}
              </button>
            </div>
            <div className="tetris-control-hint">
              <p>Controls:</p>
              <p>← → move</p>
              <p>↑ rotate</p>
              <p>↓ soft drop</p>
              <p>Space hard drop</p>
              <p>P pause</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
