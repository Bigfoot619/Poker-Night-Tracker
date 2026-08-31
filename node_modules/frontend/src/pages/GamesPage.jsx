import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGames } from '../api/games.js';

export function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listGames().then(setGames).finally(() => setLoading(false)); }, []);

  if (loading) return <p>Loading...</p>;
  if (games.length === 0) return <p className="empty-state">No games yet. Start one from the Play tab.</p>;

  return (
    <div>
      <h2>Games</h2>
      {games.map((g) => (
        <Link key={g.id} to={`/games/${g.id}`} className="list-item">
          <span className="list-item-title">
            {g.date}
            {g.status === 'in_progress' && ' · In Progress'}
          </span>
          <span className="list-item-meta">{g.handCount} hands · {g.players.length} players</span>
        </Link>
      ))}
    </div>
  );
}
