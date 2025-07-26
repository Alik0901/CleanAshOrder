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
import Login         from './screens/Login';

import NavBar        from './components/NavBar';

export default function App() {
  return (
    <div className="min-h-screen pb-16">
      <Routes>
        <Route path="/login"       element={<Login />} />
        <Route path="/"            element={<Home />} />
        <Route path="/burn"        element={<ProtectedRoute><Burn /></ProtectedRoute>} />
        <Route path="/gallery"     element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/referral"    element={<ProtectedRoute><Referral /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/final"       element={<ProtectedRoute><FinalPhrase /></ProtectedRoute>} />
        <Route path="/congrats"    element={<ProtectedRoute><Congrats /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute><ProfileStats /></ProtectedRoute>} />
        <Route path="*"            element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
      </Routes>
      <NavBar />
    </div>
  );
}
