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

  useEffect(() => {
    API.getFinal(user.tg_id)
      .then(res => {
        setCanEnter(res.canEnter);
        setLoading(false);
      })
      .catch(e => {
        console.error('[FinalPhrase] load error', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message);
          setLoading(false);
        }
      });
  }, [user.tg_id, logout, navigate]);

  const handleSubmit = async e => {
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
    return <p className="text-white p-6">Loading...</p>;
  }

  if (!canEnter) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 max-w-sm text-center">
          <BackButton className="text-white mb-4" />
          <p className="text-lg font-inter">Final phrase is not available yet.<br/>Collect all 8 fragments and return during your cleansing hour.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white flex items-center justify-center">
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 w-full max-w-md space-y-6">
        <BackButton className="text-white" />
        <h2 className="text-2xl font-bold text-center font-montserrat">Enter Final Phrase</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder="Your secret phrase"
            className="w-full px-4 py-2 bg-gray-700 rounded-lg font-inter text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
            required
          />
          {error && <p className="text-red-400 text-center font-inter">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF4757] rounded-lg font-semibold transition hover:opacity-90"
          >
            Submit Phrase
          </button>
        </form>
      </div>
    </div>
  );
}
