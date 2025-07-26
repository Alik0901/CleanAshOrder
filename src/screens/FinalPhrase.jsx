// src/screens/FinalPhrase.jsx
import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import Timer from '../components/Timer';
import { getFinalWindow, submitFinalPhrase } from '../utils/apiClient';

export default function FinalPhrase() {
  const [msLeft, setMsLeft] = useState(null);     // миллисекунд до открытия
  const [ready, setReady] = useState(false);      // true, когда можно вводить
  const [phrase, setPhrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);     // success / fail message

  useEffect(() => {
    loadWindow();
  }, []);

  async function loadWindow() {
    try {
      const { msLeft: ms, canSubmit } = await getFinalWindow();
      setMsLeft(ms);
      setReady(canSubmit);
    } catch (err) {
      console.error(err);
    }
  }

  function handleExpire() {
    setReady(true);
    setMsLeft(0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const ok = await submitFinalPhrase(phrase);
      setResult(ok ? 'success' : 'fail');
    } catch (err) {
      console.error(err);
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <BackButton />
      <h2 className="text-xl font-semibold mb-4">Final Phrase</h2>

      {!ready && msLeft != null ? (
        <div className="mb-4">
          <p>Your window opens in:</p>
          <Timer msLeft={msLeft} onExpire={handleExpire} />
        </div>
      ) : null}

      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder="Enter secret phrase"
              className="w-full border px-3 py-2 rounded"
              disabled={submitting || result === 'success'}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !phrase || result === 'success'}
            className={`w-full px-4 py-2 rounded ${
              submitting || !phrase || result === 'success'
                ? 'bg-gray-400 text-gray-700'
                : 'bg-green-600 text-white'
            }`}
          >
            {submitting
              ? 'Submitting…'
              : result === 'success'
              ? 'Submitted'
              : 'Submit Phrase'}
          </button>
          {result === 'success' && (
            <p className="text-green-600">🎉 Correct phrase!</p>
          )}
          {result === 'fail' && (
            <p className="text-red-600">❌ Incorrect, try again tomorrow.</p>
          )}
          {result === 'error' && (
            <p className="text-red-600">⚠️ Server error, please retry later.</p>
          )}
        </form>
      ) : (
        <p className="text-gray-600">Please wait for your window to open.</p>
      )}
    </div>
  );
}
