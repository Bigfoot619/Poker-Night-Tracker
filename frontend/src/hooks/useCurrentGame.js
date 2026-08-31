import { useCallback, useEffect, useState } from 'react';
import { getActiveGame, getGame } from '../api/games.js';

export function useCurrentGame(preferredGameId) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = preferredGameId ? await getGame(preferredGameId) : await getActiveGame();
      setGame(loaded);
    } finally {
      setLoading(false);
    }
  }, [preferredGameId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { game, loading, refresh, setGame };
}
