// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Welcome from './screens/Welcome';
import Init from './screens/Init';
import Path from './screens/Path';
import Profile from './screens/Profile';
import Final from './screens/Final';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/init" element={<Init />} />
        <Route path="/path" element={<Path />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/final" element={<Final />} />
        {/* на любые другие пути — перенаправляем на Welcome */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}