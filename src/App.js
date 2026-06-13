import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/navbar/navbar';
import Foryou from './pages/Foryou/Foryou';
import BottomNav from './components/layout/bottomNav/bottomNav';
import Events from './pages/Events/Events';
import AccessoriesPage from './pages/Accessories/AccessoriesPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <BottomNav />
        <Routes>
          <Route path="/" element={<Foryou />} />
          <Route path="/events" element={<Events />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
