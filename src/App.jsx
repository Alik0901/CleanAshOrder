/* import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Welcome from './screens/Welcome';
import Init from './screens/Init';
import Path from './screens/Path';
import Profile from './screens/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/test" element={<Init />} />
      <Route path="/" element={<Welcome />} />
      <Route path="/init" element={<Init />} /> 
      <Route path="/path" element={<Path />} />
      <Route path="/profile" element={<Profile />} /> 
    </Routes>
  );
}
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Init from './screens/Init';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/test" element={<Init />} />
        <Route path="/" element={<Navigate to="/test" />} />
      </Routes>
    </Router>
  );
}

