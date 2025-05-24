import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Path from './screens/Path';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Path />} />
      </Routes>
    </Router>
  );
}

export default App;
