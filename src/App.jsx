// файл: src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Навигационная панель */}
        <NavBar />

        {/* Основной контент с отступом сверху под высоту NavBar */}
        <div className="pt-16 pb-16 bg-[#0F0F1F] min-h-screen">
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
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
