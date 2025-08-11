// src/App.jsx

import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login       from './screens/Login';
import Home        from './screens/Home';
import Burn        from './screens/Burn';
import Gallery     from './screens/Gallery';
import Referral    from './screens/Referral';
import Leaderboard from './screens/Leaderboard';
import FinalPhrase from './screens/FinalPhrase';
import Congrats    from './screens/Congrats';
import Profile     from './screens/Profile';
import ThirdQuest  from './screens/ThirdQuest';

import { AuthContext } from './context/AuthContext';

export default function App() {
  const { user } = useContext(AuthContext);

  // Пока инициализируем сессию
  if (user === undefined) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={ user ? <Navigate to="/" replace /> : <Login /> }
      />

      {/* Защищённые маршруты */}
      <Route
        path="/"
        element={ user ? <Home /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/burn"
        element={ user ? <Burn /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/gallery"
        element={ user ? <Gallery /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/referral"
        element={ user ? <Referral /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/leaderboard"
        element={ user ? <Leaderboard /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/final"
        element={ user ? <FinalPhrase /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/congrats"
        element={ user ? <Congrats /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/profile"
        element={ user ? <Profile /> : <Navigate to="/login" replace /> }
      />
      <Route
        path="/third"
        element={ user ? <ThirdQuest /> : <Navigate to="/login" replace /> }
      />

      {/* Фоллбек */}
      <Route
        path="*"
        element={ user ? <Navigate to="/" replace /> : <Navigate to="/login" replace /> }
      />
    </Routes>
  );
}
