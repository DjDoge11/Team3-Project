import "/src/App.css";
import { useEffect, useMemo, useState, useCallback } from 'react';
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

  const hardDrop = useCallback(() => {
    if (!currentPiece || paused || gameOver) return;
    let targetY = currentPiece.position.y;
    while (isValidPosition(board, currentPiece.shape, { x: currentPiece.position.x, y: targetY + 1 })) {
      targetY += 1;
    }
    landPieceAt({ x: currentPiece.position.x, y: targetY });
  }, [currentPiece, paused, gameOver, board]);

  const stopGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setScore(0);
    setRowsCleared(0);
    setLevel(1);
    setPlaying(false);
    setPaused(false);
    setGameOver(false);
    setStarted(false);
    setHasSavedScore(false);
    setHighScoreMessage('');
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
  }, [playing, gameOver, board, currentPiece, paused, hardDrop]);

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
      {/* Header Section */}
      <section className="tetris-header">
        <div className="tetris-header-content">
          <div className="tetris-title-section">
          </div>

          <div className="tetris-status-section">
            <div className="tetris-user-info">
              <span className="user-status">
                {user?.email ? `👤 ${user.email}` : '👤 Guest Player'}
              </span>
              <span className="best-score-display">🏆 Best: {bestScore}</span>
            </div>
            {highScoreMessage && (
              <div className="high-score-message">{highScoreMessage}</div>
            )}
          </div>
        </div>
      </section>

      {/* Game Section */}
      <section className="tetris-game-section">
        <div className="tetris-game-container">
          {/* Main Game Board */}
          <div className="tetris-board-container">
            <div className="tetris-board" role="grid" aria-label="Tetris board">
              {displayBoard.map((row, rowIndex) => (
                <div key={rowIndex} className="tetris-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className="tetris-cell"
                      style={{
                        backgroundColor: cell || 'rgba(255, 255, 255, 0.05)',
                        boxShadow: cell
                          ? 'inset 0 0 0 1px rgba(255,255,255,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                          : 'none',
                      }}
                    />
                  ))}
                </div>
              ))}

              {/* Game State Overlays */}
              {!started && (
                <div className="tetris-overlay welcome-overlay">
                  <div className="overlay-content">
                    <h2>🎯 Ready to Play?</h2>
                    <p>Click "Start Game" to begin your Tetris adventure!</p>
                    <button className="tetris-primary-btn" onClick={resetGame}>
                      🚀 Start Game
                    </button>
                  </div>
                </div>
              )}

              {gameOver && started && (
                <div className="tetris-overlay game-over-overlay">
                  <div className="overlay-content">
                    <h2>💀 Game Over</h2>
                    <p>Final Score: {score}</p>
                    <div className="overlay-buttons">
                      <button className="tetris-primary-btn" onClick={resetGame}>
                        Play Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paused && started && !gameOver && (
                <div className="tetris-overlay pause-overlay">
                  <div className="overlay-content">
                    <h2>⏸️ Paused</h2>
                    <p>Press P or click Resume to continue</p>
                    <div className="overlay-buttons">
                      <button className="tetris-primary-btn" onClick={() => setPaused(false)}>
                        ▶️ Resume
                      </button>
                      <button className="tetris-secondary-btn" onClick={stopGame}>
                        🛑 Stop Game
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Info Panel */}
          <div className="tetris-info-panel">
            {/* Game Stats */}
            <div className="tetris-stats-section">
              <h3 className="section-title">Statistics:</h3>
              <div className="tetris-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{score}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">{level}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lines</span>
                  <span className="stat-value">{rowsCleared}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Best</span>
                  <span className="stat-value">{bestScore}</span>
                </div>
              </div>
            </div>

            {/* Next Piece */}
            <div className="tetris-next-section">
              <h3 className="section-title">Next Piece:</h3>
              <div className="tetris-next-preview">
                {nextGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className="tetris-mini-row">
                    {row.map((cell, colIndex) => (
                      <div
                        key={colIndex}
                        className="tetris-mini-cell"
                        style={{
                          backgroundColor: cell || 'rgba(255, 255, 255, 0.05)',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="tetris-controls-section">
              <h3 className="section-title">🎮 Controls</h3>
              <div className="tetris-control-buttons">
                {!started ? (
                  <button className="tetris-primary-btn full-width" onClick={resetGame}>
                    Start Game
                  </button>
                ) : (
                  <>
                    <button
                      className="tetris-secondary-btn"
                      onClick={() => setPaused(!paused)}
                      disabled={gameOver}
                    >
                      {paused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                    <button className="tetris-secondary-btn" onClick={resetGame}>
                      🔄 Restart
                    </button>
                    <button className="tetris-danger-btn" onClick={stopGame}>
                      🛑 Stop Game
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="tetris-instructions-section">
              <h3 className="section-title">📋 How to Play</h3>
              <div className="instructions-list">
                <div className="instruction-item">
                  <span className="key">← →</span>
                  <span>Move left/right</span>
                </div>
                <div className="instruction-item">
                  <span className="key">↑</span>
                  <span>Rotate piece</span>
                </div>
                <div className="instruction-item">
                  <span className="key">↓</span>
                  <span>Soft drop</span>
                </div>
                <div className="instruction-item">
                  <span className="key">Space</span>
                  <span>Hard drop</span>
                </div>
                <div className="instruction-item">
                  <span className="key">P</span>
                  <span>Pause/Resume</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
