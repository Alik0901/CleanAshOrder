// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Welcome    from './screens/Welcome';
import Login      from './screens/Login';
import Home       from './screens/Home';
import Init       from './screens/Init';
import Burn       from './screens/Burn';
import Gallery    from './screens/Gallery';
import Referral   from './screens/Referral';
import Leaderboard from './screens/Leaderboard';
import FinalPhrase from './screens/FinalPhrase';
import Congrats   from './screens/Congrats';
import Profile    from './screens/Profile';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<Home />} />

      {/* Protected */}
      <Route
        path="/burn"
        element={
          <ProtectedRoute>
            <Burn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referral"
        element={
          <ProtectedRoute>
            <Referral />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/final"
        element={
          <ProtectedRoute>
            <FinalPhrase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/congrats"
        element={
          <ProtectedRoute>
            <Congrats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
