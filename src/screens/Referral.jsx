// src/screens/Referral.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Referral() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [refCode, setRefCode]     = useState('');
  const [invited, setInvited]     = useState([]); // [{ name, date }]
  const [bonusCount, setBonusCount] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [claiming, setClaiming]   = useState(false);
  const [message, setMessage]     = useState('');

  // 1) Fetch referral data
  useEffect(() => {
    async function fetchReferral() {
      setLoading(true);
      setError('');
      try {
        // TODO: replace with real API.getReferral(user.tg_id)
        // const { code, invited, bonus } = await API.getReferral();
        await new Promise(res => setTimeout(res, 300));
        setRefCode('ABCD123');  // stub
        setInvited([
          { name: 'Alice', date: '2025-07-30' },
          { name: 'Bob',   date: '2025-07-29' },
        ]);
        setBonusCount(2);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить реферальные данные');
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, [user]);

  const shareUrl = `${window.location.origin}/login?ref=${refCode}`;

  // 2) Claim referral
  const handleClaim = async () => {
    setClaiming(true);
    setMessage('');
    try {
      // TODO: replace with real API.claimReferral()
      // await API.claimReferral();
      await new Promise(res => setTimeout(res, 300));
      setMessage('Бонус за рефералов начислен!');
      setBonusCount(bonusCount + invited.length);
    } catch (e) {
      console.error(e);
      setMessage('Ошибка при получении бонуса');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-init.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        <div className="mx-auto max-w-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 space-y-6 text-white">
          <h2 className="text-2xl font-bold text-center">Referral Program</h2>

          {loading && <p className="text-gray-300 text-center">Loading...</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}

          {!loading && !error && (
            <>
              {/* Referral Code & Link */}
              <div className="space-y-2">
                <p>Your code:</p>
                <div className="flex">
                  <input
                    type="text"
                    value={refCode}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-l-md text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(refCode);
                      setMessage('Код скопирован');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-md"
                  >
                    Copy
                  </button>
                </div>
                <p>Your link:</p>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-l-md text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setMessage('Ссылка скопирована');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-md"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Invited List */}
              <div>
                <h3 className="font-semibold">Your invited friends:</h3>
                {invited.length === 0 ? (
                  <p className="text-gray-300">No one yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {invited.map((f, idx) => (
                      <li key={idx} className="flex justify-between bg-gray-700 px-3 py-1 rounded">
                        <span>{f.name}</span>
                        <span className="text-sm text-gray-400">{f.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bonus & Claim */}
              <div className="space-y-2">
                <p>Total bonus burns: <span className="font-semibold">{bonusCount}</span></p>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                >
                  {claiming ? 'Claiming…' : 'Claim Bonus'}
                </button>
                {message && <p className="text-sm text-center text-yellow-300">{message}</p>}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
