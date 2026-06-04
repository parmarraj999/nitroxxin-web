import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/navbar/navbar';
import Foryou from './pages/Foryou/Foryou';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Foryou />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
