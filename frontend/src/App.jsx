import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { PlayersPage } from './pages/PlayersPage.jsx';
import { PlayerProfilePage } from './pages/PlayerProfilePage.jsx';
import { GamesPage } from './pages/GamesPage.jsx';
import { GameDetailPage } from './pages/GameDetailPage.jsx';
import { NewGamePage } from './pages/NewGamePage.jsx';
import { PlayPage } from './pages/PlayPage.jsx';
import { LeaderboardPage } from './pages/LeaderboardPage.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Poker Night Tracker</h1>
        <nav>
          <NavLink to="/play" className={({ isActive }) => (isActive ? 'active' : '')}>Play</NavLink>
          <NavLink to="/games" className={({ isActive }) => (isActive ? 'active' : '')}>Games</NavLink>
          <NavLink to="/players" className={({ isActive }) => (isActive ? 'active' : '')}>Players</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>Leaderboard</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/play" replace />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/new-game" element={<NewGamePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:id" element={<GameDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
