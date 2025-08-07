// src/App.jsx

import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';

import NavBar       from './components/NavBar';
import Login        from './screens/Login';
import Home         from './screens/Home';
import Burn         from './screens/Burn';
import Gallery      from './screens/Gallery';
import Referral     from './screens/Referral';
import Leaderboard  from './screens/Leaderboard';
import FinalPhrase  from './screens/FinalPhrase';
import Congrats     from './screens/Congrats';
import Profile      from './screens/Profile';

function AppRoutes() {
  const { user } = useContext(AuthContext);

  // Пока не проверили токен в AuthProvider — показываем заглушку
  if (user === undefined) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading…</div>;
  }

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* После логина показываем NavBar */}
      {user && <Route
        path="*"
        element={<NavBar />}
      />}

      {/* Защищённые */}
      <Route
        path="/"
        element={user ? <Home /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/burn"
        element={user ? <Burn /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/gallery"
        element={user ? <Gallery /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/referral"
        element={user ? <Referral /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/leaderboard"
        element={user ? <Leaderboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/final"
        element={user ? <FinalPhrase /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/congrats"
        element={user ? <Congrats /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" replace />}
      />

      {/* Любой другой путь */}
      <Route
        path="*"
        element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
