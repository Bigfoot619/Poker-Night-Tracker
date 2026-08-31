import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPlayers, createPlayer, deletePlayer } from '../api/players.js';
import { Button } from '../components/shared/Button.jsx';
import { PlayerAvatar } from '../components/shared/PlayerAvatar.jsx';
import { Modal } from '../components/shared/Modal.jsx';

export function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const refresh = () => listPlayers().then(setPlayers).finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createPlayer(name);
      setName('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await deletePlayer(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h2>Players</h2>
      <form onSubmit={handleAdd} className="card inline-form">
        <div className="field">
          <label htmlFor="player-name">New player</label>
          <input
            id="player-name"
            type="text"
            placeholder="e.g. Bigfoot"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit">Add</Button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : players.length === 0 ? (
        <p className="empty-state">No players yet. Add your first player above.</p>
      ) : (
        players.map((p) => (
          <div key={p.id} className="list-item">
            <Link to={`/players/${p.id}`} className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlayerAvatar name={p.name} size={32} />
              {p.name}
            </Link>
            <button
              type="button"
              className="link-btn"
              style={{ color: 'var(--loss)' }}
              onClick={() => { setDeleteError(''); setDeleteTarget(p); }}
            >
              Delete
            </button>
          </div>
        ))
      )}

      {deleteTarget && (
        <Modal title={`Delete ${deleteTarget.name}?`} onClose={() => setDeleteTarget(null)}>
          <p>This can't be undone. Players who have already played in a game can't be deleted, to keep past results intact.</p>
          {deleteError && <p className="error-text">{deleteError}</p>}
          <div className="play-actions">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Player'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
