// src/screens/Profile.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleDelete() {
    if (!confirm('Delete your account and all data?')) return;
    await API.deletePlayer(user.tg_id);
    logout();
    navigate('/');
  }

  return (
    <div className="p-4 space-y-4">
      <BackButton />
      <h2 className="text-xl font-semibold">Profile</h2>
      <p><strong>Telegram ID:</strong> {user.tg_id}</p>
      <p><strong>Name:</strong> {user.name || '—'}</p>
      <button
        onClick={logout}
        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
      <button
        onClick={handleDelete}
        className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
      >
        Delete Account
      </button>
    </div>
  );
}
