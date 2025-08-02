import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function DailyQuest() {
  const { logout } = useContext(AuthContext);
  const [canClaim, setCanClaim] = useState(false);
  const [coupon, setCoupon]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    API.getDailyQuest()
      .then(data => {
        setCanClaim(data.canClaim);
        setCoupon(data.coupon);
      })
      .catch(e => {
        if (e.message.toLowerCase().includes('invalid token')) logout();
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  const handleClaim = () => {
    API.claimDailyQuest()
      .then(data => {
        setCoupon(data.coupon);
        setCanClaim(false);
      })
      .catch(e => setError(e.message));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      {canClaim ? (
        <button onClick={handleClaim} className="px-4 py-2 bg-green-600 text-white">
          Claim Daily Quest: {coupon}% off
        </button>
      ) : (
        <p>Daily coupon: {coupon}% (already claimed)</p>
      )}
    </div>
  );
}