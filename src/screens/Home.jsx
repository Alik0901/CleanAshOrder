// src/screens/Home.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ash Bot</h1>
      {user ? (
        <>
          <p className="mb-4">Welcome back, {user.name || user.tg_id}!</p>
          <Link to="/burn" className="btn-primary mb-4">🔥 Burn Yourself</Link>
          <button onClick={logout} className="text-sm text-red-600">Logout</button>
        </>
      ) : (
        <Link to="/login" className="btn-primary">Login with Telegram ID</Link>
      )}
    </div>
  );
}
