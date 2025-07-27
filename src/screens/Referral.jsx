// src/screens/Referral.jsx
import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import API from '../utils/apiClient';

export default function Referral() {
  const [refCode, setRefCode] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [rewardIssued, setRewardIssued] = useState(false);
  const [loading, setLoading] = useState(false);

  // Уровни реферальной программы
  const tiers = [
    { label: '1 Friend', requirement: 1, reward: '+1 fragment' },
    { label: '5 Friends', requirement: 5, reward: '2× chance' },
    { label: '10 Friends', requirement: 10, reward: 'Unique fragment' },
  ];

  useEffect(() => {
    loadReferral();
  }, []);

  async function loadReferral() {
    try {
      const { refCode, invitedCount, rewardIssued } = await API.getReferral();
      setRefCode(refCode);
      setInvitedCount(invitedCount);
      setRewardIssued(rewardIssued);
    } catch (err) {
      console.error('Failed to load referral data', err);
    }
  }

  async function handleClaim() {
    setLoading(true);
    try {
      const { fragment } = await API.claimReferral();
      setRewardIssued(true);
      // Можно здесь показать пользователю, какой фрагмент он получил
      console.log('Claimed fragment:', fragment);
    } catch (err) {
      console.error('Failed to claim referral reward', err);
    } finally {
      setLoading(false);
    }
  }

  // Генерируем deeplink для Telegram
  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'YourBotUsername';
  const shareLink = `https://t.me/${botUsername}?start=${refCode}`;

  return (
    <div className="p-4">
      <BackButton />

      <h2 className="text-xl font-semibold mb-4">Invite Friends</h2>

      <p className="mb-4">
        Your referral code:{' '}
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
          {refCode || '—'}
        </span>
      </p>

      <div className="grid gap-2 mb-4">
        {tiers.map(({ label, requirement, reward }) => (
          <div
            key={label}
            className="flex justify-between items-center p-2 border rounded"
          >
            <div>
              <div className="font-semibold">{label}</div>
              <div className="text-sm text-gray-600">{reward}</div>
            </div>
            <div className="text-sm">
              {invitedCount >= requirement
                ? '✅'
                : `${requirement - invitedCount} more`}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigator.clipboard.writeText(shareLink)}
        className="mb-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Copy Invite Link
      </button>

      <button
        onClick={handleClaim}
        disabled={invitedCount < tiers[0].requirement || rewardIssued}
        className={`w-full px-4 py-2 rounded ${
          invitedCount < tiers[0].requirement || rewardIssued
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {rewardIssued
          ? 'Reward Claimed'
          : loading
          ? 'Claiming…'
          : `Claim Reward (${tiers[0].requirement} friends)`}
      </button>
    </div>
  );
}
