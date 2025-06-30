import React, { useEffect, useState } from 'react';
import './App.css';

// Backend API base URL (adjust endpoint if running backend elsewhere)
const API_BASE = 'http://localhost:8000';

// Helper function: fetch JSON with error handling
// PUBLIC_INTERFACE
async function fetchJson(url, options = {}) {
  /** Fetches JSON from the specified URL with fetch API and returns the parsed response. Throws error on non-2xx. */
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// PUBLIC_INTERFACE
function App() {
  /** Main App component for Tic Tac Toe frontend UI and logic. */
  const [theme, setTheme] = useState('light');
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null)); // 0-8 for 3x3 board
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [status, setStatus] = useState('Ready to start');
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [winner, setWinner] = useState(null);
  const [winningCombo, setWinningCombo] = useState([]);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const startNewGame = async () => {
    setIsLoading(true);
    setError('');
    setWinner(null);
    setWinningCombo([]);
    try {
      // Start a new game via backend
      const data = await fetchJson(`${API_BASE}/game/new`, { method: "POST" });
      setGameId(data.game_id);
      setBoard(data.board);
      setCurrentPlayer(data.current_player);
      setStatus('Game started: your turn!');
      setIsGameActive(true);
    } catch (err) {
      setError('Failed to start new game.');
    } finally {
      setIsLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const makeMove = async idx => {
    if (!isGameActive || board[idx] !== null) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchJson(`${API_BASE}/game/move`, {
        method: "POST",
        body: JSON.stringify({
          game_id: gameId,
          position: idx,
          player: currentPlayer
        }),
      });
      setBoard(data.board);
      setCurrentPlayer(data.current_player);
      setStatus(data.status_message || '');
      if (data.winner) {
        setWinner(data.winner);
        setIsGameActive(false);
        setStatus(data.status_message || (data.winner === 'Draw' ? "It's a draw!" : `${data.winner} wins!`));
        setWinningCombo(data.winning_combo || []);
      } else if (data.status_message && data.status_message.toLowerCase().includes("draw")) {
        setWinner('Draw');
        setIsGameActive(false);
        setStatus("It's a draw!");
      }
    } catch (err) {
      setError('Invalid move or server error.');
    } finally {
      setIsLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const cellClass = idx => {
    if (winningCombo.includes(idx)) return 'ttt-cell win';
    return 'ttt-cell';
  };

  // Rendering game board
  const renderBoard = () => (
    <div className="ttt-board">
      {board.map((val, idx) => (
        <button
          className={cellClass(idx)}
          key={idx}
          onClick={() => makeMove(idx)}
          disabled={val !== null || !isGameActive || isLoading}
          aria-label={`Cell ${idx % 3 + 1}, ${Math.floor(idx/3)+1}`}
        >
          {val}
        </button>
      ))}
    </div>
  );

  return (
    <div className="App">
      <header className="App-header" style={{gap: 20, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 style={{fontFamily: 'inherit', marginBottom: 0, color: 'var(--text-primary)'}}>Tic Tac Toe</h1>
        <div style={{marginBottom: 16, color: 'var(--text-secondary)'}}>
          Classic 3x3 game &mdash; Play vs another player <span role="img" aria-label="sparkles">✨</span>
        </div>
        <div className="ttt-status" data-testid="status-text"
          style={{
            color: winner === 'Draw'
              ? '#1976d2'
              : winner
                ? '#388e3c'
                : (currentPlayer === 'X' ? '#1976d2' : '#388e3c'),
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 18,
          }}>
          {status}
        </div>
        {error && <div className="ttt-error" style={{color: 'red', marginBottom: 8}}>{error}</div>}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {renderBoard()}
          <div style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button
              className="ttt-btn"
              style={{
                background: 'var(--button-bg)',
                color: 'var(--button-text)',
                fontWeight: 700,
                padding: '10px 22px',
                borderRadius: 8,
                fontSize: 16,
                marginRight: 10,
                border: 'none'
              }}
              onClick={startNewGame}
              disabled={isLoading}
            >
              {gameId && isGameActive ? 'Restart Game' : 'Start New Game'}
            </button>
            <span style={{
              fontSize: 14, color: 'var(--text-secondary)'
            }}>
              {isGameActive ? `Turn: ${currentPlayer}` : winner ? 'Game over' : ''}
            </span>
          </div>
        </div>
        <footer style={{marginTop: 32, fontSize: 12, color: "var(--text-secondary)"}}>
          <a className="App-link" href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">
            Built with React
          </a>
        </footer>
      </header>
    </div>
  );
}

export default App;

