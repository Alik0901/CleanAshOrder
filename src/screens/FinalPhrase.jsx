// src/screens/FinalPhrase.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';

export default function FinalPhrase() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [canEnter, setCanEnter] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'fail' | 'error'

  // Проверяем, может ли пользователь сейчас ввести фразу
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { canEnter } = await API.getFinal(user.tg_id);
        setCanEnter(!!canEnter);
      } catch (err) {
        console.error('Failed to load final status', err);
      }
    })();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const { success } = await API.validateFinal(phrase);
      if (success) {
        // Успех — редирект на экран поздравления
        navigate('/congrats');
      } else {
        setResult('fail');
      }
    } catch (err) {
      console.error('Submit error', err);
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <BackButton />
      <h2 className="text-xl font-semibold mb-4">Final Phrase</h2>

      {canEnter ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder="Enter secret phrase"
            className="w-full border px-3 py-2 rounded"
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={!phrase || submitting}
            className={`w-full px-4 py-2 rounded ${
              !phrase || submitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit Phrase'}
          </button>

          {result === 'fail' && (
            <p className="text-red-600">❌ Incorrect, try again tomorrow.</p>
          )}
          {result === 'error' && (
            <p className="text-red-600">⚠️ Server error, please retry later.</p>
          )}
        </form>
      ) : (
        <p className="text-gray-600">
          You can only enter the final phrase once you have all fragments.
        </p>
      )}
    </div>
  );
}
