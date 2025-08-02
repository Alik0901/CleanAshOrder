// файл: src/screens/FinalPhrase.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function FinalPhrase() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [canEnter, setCanEnter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');

  // Проверяем, можно ли вводить финальную фразу
  useEffect(() => {
    API.getFinal(user.tg_id)
      .then(res => {
        setCanEnter(res.canEnter);
        setLoading(false);
      })
      .catch(e => {
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message);
          setLoading(false);
        }
      });
  }, [user.tg_id, logout, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.validateFinal(phrase.trim());
      if (res.ok) {
        navigate('/congrats');
      }
    } catch (e) {
      setError(e.message || 'Incorrect phrase');
    }
  };

  if (loading) {
    return <p className="text-white p-4">Loading...</p>;
  }

  if (!canEnter) {
    return (
      <div className="p-6 text-white">
        <BackButton className="text-white" />
        <p className="mt-4">Финальная фраза пока недоступна. Соберите все 8 фрагментов и введите в свою минуту очищения.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/images/bg-final.webp')" }}>
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 mx-auto max-w-md p-6 bg-gray-900 bg-opacity-90 rounded-xl space-y-4">
        <BackButton className="text-white" />
        <h2 className="text-2xl font-bold text-center">Enter Final Phrase</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder="Your secret phrase"
            className="w-full px-4 py-2 bg-gray-800 rounded text-white"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            Submit Phrase
          </button>
        </form>
      </div>
    </div>
  );
}
