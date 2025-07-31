// src/screens/FinalPhrase.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function FinalPhrase() {
  const { user }     = useContext(AuthContext);
  const navigate     = useNavigate();

  const [phrase, setPhrase]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!phrase.trim()) return;
    setLoading(true);
    setError('');
    try {
      // TODO: заменить на реальный вызов API.validateFinal
      // await API.validateFinal(user.tg_id, phrase);
      await new Promise(res => setTimeout(res, 500));
      // если прошло успешно
      navigate('/congrats');
    } catch (e) {
      console.error(e);
      setError(e.error || e.message || 'Неверная фраза');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-final.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        <div className="mx-auto max-w-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 space-y-6 text-white">
          <h2 className="text-2xl font-bold text-center">Enter Final Phrase</h2>

          <p className="text-gray-300 text-sm text-center">
            Combine the secret words from your 8 fragments.
          </p>

          <textarea
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            rows={4}
            placeholder="Type your final phrase here..."
            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
          />

          {error && (
            <p className="text-red-400 text-center text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !phrase.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition
              ${phrase.trim() && !loading
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
