// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home          from './screens/Home';
import Burn          from './screens/Burn';
import Gallery       from './screens/Gallery';
import Referral      from './screens/Referral';
import Leaderboard   from './screens/Leaderboard';
import FinalPhrase   from './screens/FinalPhrase';
import Congrats      from './screens/Congrats';
import Marketplace   from './screens/Marketplace';
import ProfileStats  from './screens/ProfileStats';

import NavBar        from './components/NavBar';

export default function App() {
  return (
    <div className="min-h-screen pb-16">
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/burn"        element={<Burn />} />
        <Route path="/gallery"     element={<Gallery />} />
        <Route path="/referral"    element={<Referral />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/final"       element={<FinalPhrase />} />
        <Route path="/congrats"    element={<Congrats />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile"     element={<ProfileStats />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </div>
  );
}
