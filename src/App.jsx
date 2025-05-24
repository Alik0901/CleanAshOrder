import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './screens/Welcome';
import Path from './screens/Path';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/path" element={<Path />} />
      </Routes>
    </Router>
  );
}

export default App;
