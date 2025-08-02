// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';

import Login       from './screens/Login';
import Home        from './screens/Home';
import Burn        from './screens/Burn';
import Gallery     from './screens/Gallery';
import Referral    from './screens/Referral';
import Leaderboard from './screens/Leaderboard';
import FinalPhrase from './screens/FinalPhrase';
import Congrats    from './screens/Congrats';
import Profile     from './screens/Profile';
import DailyQuest  from './screens/DailyQuest';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Навбар на всех страницах */}
        <NavBar />

        {/* Основной контейнер с отступом сверху под высоту NavBar */}
        <div className="pt-16 pb-16 min-h-screen bg-[#0F0F1F]">
          <Routes>
         {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<Home />} />

      {/* Protected */}
      <Route path="/burn"        element={<ProtectedRoute><Burn/></ProtectedRoute>} />
      <Route path="/gallery"     element={<ProtectedRoute><Gallery/></ProtectedRoute>} />
      <Route path="/referral"    element={<ProtectedRoute><Referral/></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard/></ProtectedRoute>} />
      <Route path="/final"       element={<ProtectedRoute><FinalPhrase/></ProtectedRoute>} />
      <Route path="/congrats"    element={<ProtectedRoute><Congrats/></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><Profile/></ProtectedRoute>} />
      <Route path="/daily-quest" element={<DailyQuest />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}



