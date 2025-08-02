import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API           from '../utils/apiClient';

export default function Leaderboard() {
  const { logout } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.getLeaderboard()
      .then(setLeaders)
      .catch(e => {
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
        } else {
          setError(e.message);
        }
      });
  }, [logout]);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ol className="space-y-2">
        {leaders.map((u, i) => (
          <li key={u.tg_id} className="flex justify-between">
            <span>#{i+1} {u.name}</span>
            <span>{u.totalTon} TON ({u.totalBurns} burns)</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
