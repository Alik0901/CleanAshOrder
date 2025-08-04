import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';

import Home         from './screens/Home';
import Login        from './screens/Login';
import Burn         from './screens/Burn';
import Gallery      from './screens/Gallery';
import Referral     from './screens/Referral';
import Leaderboard  from './screens/Leaderboard';
import FinalPhrase  from './screens/FinalPhrase';
import Congrats     from './screens/Congrats';
import Profile      from './screens/Profile';

export default function App() {
  return (
    <>
      {/* Навигационная панель всегда сверху */}
      {/* <NavBar /> */}

      {/* Основные роуты без дополнительной обёртки-фона */}
      <Routes>
        {/* Публичный маршрут */}
        <Route path="/login" element={<Login />} />

        {/* Защищённые маршруты */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/burn" element={<ProtectedRoute><Burn /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/final" element={<ProtectedRoute><FinalPhrase /></ProtectedRoute>} />
        <Route path="/congrats" element={<ProtectedRoute><Congrats /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Прочие маршруты */}
      </Routes>
    </>
  );
}
